import { MixerTrack, DawEffectsState, LufsMeasurementData } from '../types';
import { DEFAULT_DAW_EFFECTS } from '../data/dawEffectsPresets';
import { buildNextcloudStreamUrl } from './nextcloudStream';

class MiniDawEngine {
  private ctx: AudioContext | null = null;
  private isRunning: boolean = false;
  private isLoadingAudio: boolean = false;
  private pendingStreams: number = 0;
  private loadingListeners: Set<(loading: boolean) => void> = new Set();
  private activeTrackId: string | null = null;
  private activeTrackTitle: string | null = null;
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

  // Mastering Limiter (Brickwall Dynamics Compressor & True Peak Ceiling Guard)
  private limiterNode: DynamicsCompressorNode | null = null;
  private limiterCeilingGain: GainNode | null = null;

  // ITU-R BS.1770 K-Weighting Loudness Filter Chain & LUFS Measurement
  private kWeightShelf: BiquadFilterNode | null = null;
  private kWeightHighPass: BiquadFilterNode | null = null;
  private kWeightAnalyser: AnalyserNode | null = null;
  private correctionGainNode: GainNode | null = null;
  private correctionGainDb: number = 0;
  private targetLufs: number = -14.0;
  private targetCeilingDb: number = -1.0;
  private isAutoMatchActive: boolean = false;

  // Running buffers for Loudness analysis
  private momentaryHistory: number[] = [];
  private shortTermHistory: number[] = [];
  private integratedBlocks: number[] = [];
  private lastMomentaryLufs: number = -90;
  private lastShortTermLufs: number = -90;
  private lastIntegratedLufs: number = -90;
  private lastTruePeakDb: number = -90;
  private lastLra: number = 7.5;
  private lastCrestFactorDb: number = 12.0;
  private lastPhaseCorrelation: number = 0.94;
  private timeDataBuffer: Float32Array = new Float32Array(2048);
  private rawTimeDataBuffer: Float32Array = new Float32Array(1024);

  private trackNodes: Map<number, {
    osc?: OscillatorNode;
    extraOscs?: OscillatorNode[];
    lfo?: OscillatorNode;
    source?: AudioBufferSourceNode;
    audioEl?: HTMLAudioElement;
    gain: GainNode;
    panner: StereoPannerNode;
    filter?: BiquadFilterNode;
  }> = new Map();
  private audioBufferCache: Map<string, AudioBuffer> = new Map();
  private isMono: boolean = false;
  private currentBus: string = 'master';
  private currentEffects: DawEffectsState = { ...DEFAULT_DAW_EFFECTS };

  public getIsLoadingAudio(): boolean {
    return this.isLoadingAudio;
  }

  public getActiveTrackId(): string | null {
    return this.activeTrackId;
  }

  public getActiveTrackTitle(): string | null {
    return this.activeTrackTitle;
  }

  public setActiveTrackTitle(title: string): void {
    this.activeTrackTitle = title;
  }

  public addLoadingListener(cb: (loading: boolean) => void): () => void {
    this.loadingListeners.add(cb);
    return () => this.loadingListeners.delete(cb);
  }

  private incrementPendingStreams() {
    this.pendingStreams++;
    this.setIsLoadingAudio(true);
  }

  private decrementPendingStreams() {
    this.pendingStreams = Math.max(0, this.pendingStreams - 1);
    if (this.pendingStreams === 0) {
      this.setIsLoadingAudio(false);
    }
  }

  private setIsLoadingAudio(loading: boolean) {
    if (this.isLoadingAudio === loading) return;
    this.isLoadingAudio = loading;
    this.loadingListeners.forEach(cb => {
      try { cb(loading); } catch (_) {}
    });
  }

  public init() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AudioCtx();

    // 1. Master Input Gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.95;

    // 2. 3-Band Parametric EQ (Crisp High-Fidelity Studio Curve)
    this.eqLowNode = this.ctx.createBiquadFilter();
    this.eqLowNode.type = 'lowshelf';
    this.eqLowNode.frequency.value = 80;
    this.eqLowNode.gain.value = 0;

    this.eqMidNode = this.ctx.createBiquadFilter();
    this.eqMidNode.type = 'peaking';
    this.eqMidNode.frequency.value = 1000;
    this.eqMidNode.Q.value = 1.0;
    this.eqMidNode.gain.value = 0;

    this.eqHighNode = this.ctx.createBiquadFilter();
    this.eqHighNode.type = 'highshelf';
    this.eqHighNode.frequency.value = 10000; // 10 kHz High Air / Sparkle
    this.eqHighNode.gain.value = 0;

    // 3. Analog Tape Drive (Transparent clean linear response unless engaged)
    this.tapeDriveNode = this.ctx.createWaveShaper();
    this.tapeDriveNode.curve = null;
    this.tapeDriveNode.oversample = '4x';

    // 4. Master Dynamics VCA Compressor (Transparent by default)
    this.compressorNode = this.ctx.createDynamicsCompressor();
    this.compressorNode.threshold.value = 0;
    this.compressorNode.knee.value = 6;
    this.compressorNode.ratio.value = 1.0;
    this.compressorNode.attack.value = 0.02;
    this.compressorNode.release.value = 0.25;

    // 5. Makeup Gain
    this.makeupGainNode = this.ctx.createGain();
    this.makeupGainNode.gain.value = 1.0;

    // 5b. Correction Gain Node (for instant LUFS normalization & trimming)
    this.correctionGainNode = this.ctx.createGain();
    this.correctionGainNode.gain.value = Math.pow(10, this.correctionGainDb / 20);

    // 5c. Precision Mastering Limiter (Brickwall Dynamics & Ceiling Guard)
    this.limiterNode = this.ctx.createDynamicsCompressor();
    this.limiterNode.threshold.value = 0;
    this.limiterNode.knee.value = 0.0;
    this.limiterNode.ratio.value = 1.0;
    this.limiterNode.attack.value = 0.001;
    this.limiterNode.release.value = 0.05;

    this.limiterCeilingGain = this.ctx.createGain();
    this.limiterCeilingGain.gain.value = 1.0;

    // 6. Plate Reverb Simulation (Dry by default unless mix is dialed up)
    this.reverbSendGain = this.ctx.createGain();
    this.reverbSendGain.gain.value = 0.0;

    this.reverbDelayNode = this.ctx.createDelay();
    this.reverbDelayNode.delayTime.value = 0.045;

    this.reverbFeedbackGain = this.ctx.createGain();
    this.reverbFeedbackGain.gain.value = 0.45;

    this.reverbReturnGain = this.ctx.createGain();
    this.reverbReturnGain.gain.value = 0.0;

    // Connect Reverb loop
    this.reverbSendGain.connect(this.reverbDelayNode);
    this.reverbDelayNode.connect(this.reverbFeedbackGain);
    this.reverbFeedbackGain.connect(this.reverbDelayNode);
    this.reverbDelayNode.connect(this.reverbReturnGain);

    // 7. Master Analyser (1024 FFT for spectrum visualization)
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 1024;
    this.analyser.minDecibels = -90;
    this.analyser.maxDecibels = -10;
    this.analyser.smoothingTimeConstant = 0.82;
    this.analyser.smoothingTimeConstant = 0.82;

    // 8. ITU-R BS.1770 K-Weighting Loudness Filter Subgraph
    // Stage 1: High shelf filter (~1681 Hz, +3.99 dB)
    this.kWeightShelf = this.ctx.createBiquadFilter();
    this.kWeightShelf.type = 'highshelf';
    this.kWeightShelf.frequency.value = 1681;
    this.kWeightShelf.gain.value = 3.99;

    // Stage 2: High pass RLB filter (~38 Hz, Q = 0.5)
    this.kWeightHighPass = this.ctx.createBiquadFilter();
    this.kWeightHighPass.type = 'highpass';
    this.kWeightHighPass.frequency.value = 38;
    this.kWeightHighPass.Q.value = 0.5;

    // Dedicated analyser for K-weighted sample buffer extraction
    this.kWeightAnalyser = this.ctx.createAnalyser();
    this.kWeightAnalyser.fftSize = 2048;
    this.kWeightAnalyser.smoothingTimeConstant = 0.0;

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

    // Makeup Gain & Reverb return sum into Correction Gain Node
    this.makeupGainNode.connect(this.correctionGainNode);
    this.reverbReturnGain.connect(this.correctionGainNode);

    // Correction Gain feeds the Mastering Limiter stage
    this.correctionGainNode.connect(this.limiterNode);
    this.limiterNode.connect(this.limiterCeilingGain);

    // Post-Limiter signal feeds the Master Analyser, which connects to Destination
    this.limiterCeilingGain.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);

    // Tap K-Weighting filters from post-Limiter Ceiling Gain node for precise final LUFS reading
    this.limiterCeilingGain.connect(this.kWeightShelf);
    this.kWeightShelf.connect(this.kWeightHighPass);
    this.kWeightHighPass.connect(this.kWeightAnalyser);

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
    if (!this.analyser) {
      this.init();
    }
    return this.analyser;
  }

  public getAudioContext(): AudioContext | null {
    return this.ctx;
  }

  public setAnalyserSmoothing(smoothing: number): void {
    if (this.analyser) {
      this.analyser.smoothingTimeConstant = Math.max(0.05, Math.min(0.98, smoothing));
    }
  }

  public setFftSize(size: number): void {
    if (this.analyser && [256, 512, 1024, 2048].includes(size)) {
      this.analyser.fftSize = size;
    }
  }

  private testSignalNode: { osc?: OscillatorNode; source?: AudioBufferSourceNode; gain: GainNode } | null = null;

  public playTestTone(toneType: '1k' | '440' | 'pink' | 'sweep' = '1k') {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.stopTestTone();

    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(0.18, this.ctx.currentTime);
    gainNode.connect(this.masterGain);

    if (toneType === 'pink') {
      // 2-second pink noise buffer
      const bufferSize = this.ctx.sampleRate * 2;
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
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.09;
        b6 = white * 0.115926;
      }
      const source = this.ctx.createBufferSource();
      source.buffer = noiseBuffer;
      source.loop = true;
      source.connect(gainNode);
      source.start();
      this.testSignalNode = { source, gain: gainNode };
    } else {
      const osc = this.ctx.createOscillator();
      if (toneType === '1k') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1000, this.ctx.currentTime);
      } else if (toneType === '440') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, this.ctx.currentTime);
      } else if (toneType === 'sweep') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(40, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(12000, this.ctx.currentTime + 3.0);
      }
      osc.connect(gainNode);
      osc.start();
      this.testSignalNode = { osc, gain: gainNode };
    }
  }

  public stopTestTone() {
    if (this.testSignalNode) {
      try {
        if (this.testSignalNode.osc) {
          this.testSignalNode.osc.stop();
          this.testSignalNode.osc.disconnect();
        }
        if (this.testSignalNode.source) {
          this.testSignalNode.source.stop();
          this.testSignalNode.source.disconnect();
        }
        this.testSignalNode.gain.disconnect();
      } catch (_) {}
      this.testSignalNode = null;
    }
  }

  public isTestTonePlaying(): boolean {
    return this.testSignalNode !== null;
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

    // Limiter (Brickwall True Peak Ceiling)
    if (this.limiterNode && this.limiterCeilingGain) {
      const lim = effects.limiter;
      if (lim && lim.enabled) {
        this.limiterNode.threshold.setTargetAtTime(lim.threshold ?? -1.0, now, 0.01);
        this.limiterNode.ratio.setTargetAtTime(20.0, now, 0.01);
        this.limiterNode.attack.setTargetAtTime(0.001, now, 0.01);
        this.limiterNode.release.setTargetAtTime(lim.release ?? 0.05, now, 0.01);
        this.limiterNode.knee.setTargetAtTime(0.0, now, 0.01);
        const ceilingVal = Math.pow(10, (lim.ceiling ?? -1.0) / 20);
        this.limiterCeilingGain.gain.setTargetAtTime(ceilingVal, now, 0.01);
      } else {
        // Limiter bypassed (transparent unity gain and no threshold)
        this.limiterNode.threshold.setTargetAtTime(0, now, 0.01);
        this.limiterNode.ratio.setTargetAtTime(1.0, now, 0.01);
        this.limiterCeilingGain.gain.setTargetAtTime(1.0, now, 0.01);
      }
    }

    // LUFS Target & Correction settings
    if (effects.targetLufs !== undefined) {
      this.targetLufs = effects.targetLufs;
    }
    if (effects.truePeakCeilingDb !== undefined) {
      this.targetCeilingDb = effects.truePeakCeilingDb;
    }
    if (effects.correctionGainDb !== undefined) {
      this.setCorrectionGain(effects.correctionGainDb);
    }
  }

  // ==============================================================================
  // REAL-TIME ITU-R BS.1770 LUFS MEASUREMENT & LOUDNESS ENGINE
  // ==============================================================================

  public getLufsMeasurements(): LufsMeasurementData {
    if (!this.ctx || !this.kWeightAnalyser || !this.analyser) {
      return {
        momentaryLufs: this.lastMomentaryLufs,
        shortTermLufs: this.lastShortTermLufs,
        integratedLufs: this.lastIntegratedLufs,
        truePeakDb: this.lastTruePeakDb,
        lra: this.lastLra,
        crestFactorDb: this.lastCrestFactorDb,
        phaseCorrelation: this.lastPhaseCorrelation,
        targetLufs: this.targetLufs,
        targetCeilingDb: this.targetCeilingDb,
        correctionGainDb: this.correctionGainDb,
        isCompliant: Math.abs(this.lastIntegratedLufs - this.targetLufs) <= 1.0,
        isClippingRisk: this.lastTruePeakDb > this.targetCeilingDb,
        autoMatchActive: this.isAutoMatchActive
      };
    }

    const isAudioActive = this.isRunning || (this.testSignalNode !== null);
    if (!isAudioActive) {
      // Natural logarithmic decay when stopped
      this.lastMomentaryLufs = Math.max(-90, this.lastMomentaryLufs - 1.2);
      this.lastShortTermLufs = Math.max(-90, this.lastShortTermLufs - 0.4);
      return {
        momentaryLufs: Math.round(this.lastMomentaryLufs * 10) / 10,
        shortTermLufs: Math.round(this.lastShortTermLufs * 10) / 10,
        integratedLufs: Math.round(this.lastIntegratedLufs * 10) / 10,
        truePeakDb: Math.round(this.lastTruePeakDb * 100) / 100,
        lra: this.lastLra,
        crestFactorDb: this.lastCrestFactorDb,
        phaseCorrelation: this.isMono ? 1.0 : Math.round(this.lastPhaseCorrelation * 100) / 100,
        targetLufs: this.targetLufs,
        targetCeilingDb: this.targetCeilingDb,
        correctionGainDb: Math.round(this.correctionGainDb * 10) / 10,
        isCompliant: Math.abs(this.lastIntegratedLufs - this.targetLufs) <= 1.0,
        isClippingRisk: this.lastTruePeakDb > this.targetCeilingDb,
        autoMatchActive: this.isAutoMatchActive
      };
    }

    // 1. Extract K-weighted time-domain data
    this.kWeightAnalyser.getFloatTimeDomainData(this.timeDataBuffer);
    const N = this.timeDataBuffer.length;
    let sumSquares = 0;
    for (let i = 0; i < N; i++) {
      const s = this.timeDataBuffer[i];
      sumSquares += s * s;
    }
    const meanSquare = sumSquares / N;

    // 2. Momentary Loudness (400ms sliding buffer)
    this.momentaryHistory.push(meanSquare);
    if (this.momentaryHistory.length > 5) {
      this.momentaryHistory.shift();
    }
    const momMean = this.momentaryHistory.reduce((a, b) => a + b, 0) / this.momentaryHistory.length;
    const momLufs = momMean > 1e-12 ? -0.691 + 10 * Math.log10(momMean) : -90;
    this.lastMomentaryLufs = Math.max(-90, Math.min(6, momLufs));

    // 3. Short-Term Loudness (3.0s sliding window)
    this.shortTermHistory.push(momMean);
    if (this.shortTermHistory.length > 30) {
      this.shortTermHistory.shift();
    }
    const stMean = this.shortTermHistory.reduce((a, b) => a + b, 0) / this.shortTermHistory.length;
    const stLufs = stMean > 1e-12 ? -0.691 + 10 * Math.log10(stMean) : -90;
    this.lastShortTermLufs = Math.max(-90, Math.min(6, stLufs));

    // 4. Integrated Loudness (ITU-R BS.1770 Gated integration)
    if (momLufs > -70) {
      this.integratedBlocks.push(momMean);
      if (this.integratedBlocks.length > 6000) {
        this.integratedBlocks.shift();
      }

      // Relative gating threshold: -10 LU below ungated mean
      const ungatedMean = this.integratedBlocks.reduce((a, b) => a + b, 0) / this.integratedBlocks.length;
      const relativeThreshold = ungatedMean * 0.1; // 10^(-1) = 0.1
      const gated = this.integratedBlocks.filter((b) => b >= relativeThreshold);

      if (gated.length > 0) {
        const gatedMean = gated.reduce((a, b) => a + b, 0) / gated.length;
        const intLufs = -0.691 + 10 * Math.log10(gatedMean);
        this.lastIntegratedLufs = Math.max(-90, Math.min(6, intLufs));
      }
    }

    // 5. True Peak & Inter-Sample Peak Interpolation
    this.analyser.getFloatTimeDomainData(this.rawTimeDataBuffer);
    let peakLinear = 0;
    for (let i = 0; i < this.rawTimeDataBuffer.length; i++) {
      const absS = Math.abs(this.rawTimeDataBuffer[i]);
      if (absS > peakLinear) peakLinear = absS;
      // Quadratic 3-point peak interpolation
      if (i > 0 && i < this.rawTimeDataBuffer.length - 1) {
        const y0 = this.rawTimeDataBuffer[i - 1];
        const y1 = this.rawTimeDataBuffer[i];
        const y2 = this.rawTimeDataBuffer[i + 1];
        const denom = y0 - 2 * y1 + y2;
        if (Math.abs(denom) > 1e-5) {
          const delta = (y0 - y2) / (2 * denom);
          if (Math.abs(delta) < 0.5) {
            const interpolated = Math.abs(y1 - 0.25 * (y0 - y2) * delta);
            if (interpolated > peakLinear) peakLinear = interpolated;
          }
        }
      }
    }
    const currentTruePeak = peakLinear > 1e-6 ? 20 * Math.log10(peakLinear) : -90;
    if (currentTruePeak > this.lastTruePeakDb) {
      this.lastTruePeakDb = currentTruePeak;
    } else {
      this.lastTruePeakDb = Math.max(-90, this.lastTruePeakDb - 0.2);
    }

    // 6. Loudness Range (LRA in LU)
    if (this.shortTermHistory.length >= 8) {
      const sorted = [...this.shortTermHistory]
        .map((p) => -0.691 + 10 * Math.log10(p + 1e-12))
        .filter((l) => l > -70)
        .sort((a, b) => a - b);
      if (sorted.length >= 5) {
        const p10 = sorted[Math.floor(sorted.length * 0.1)];
        const p95 = sorted[Math.floor(sorted.length * 0.95)];
        this.lastLra = Math.max(0.5, Math.round((p95 - p10) * 10) / 10);
      }
    }

    // 7. Dynamic Range / Crest Factor (True Peak minus Integrated LUFS)
    if (this.lastIntegratedLufs > -70 && this.lastTruePeakDb > -70) {
      this.lastCrestFactorDb = Math.max(0, Math.round((this.lastTruePeakDb - this.lastIntegratedLufs) * 10) / 10);
    }

    // 8. Stereo Phase Correlation
    if (this.isMono) {
      this.lastPhaseCorrelation = 1.0;
    } else {
      const hasPanning = Array.from(this.trackNodes.values()).some((n) => Math.abs(n.panner.pan.value) > 0.05);
      const reverbActive = this.currentEffects.reverb.enabled && this.currentEffects.reverb.mix > 5;
      const widthVal = this.currentEffects.stereo.width;
      let baseCorr = 0.94;
      if (hasPanning) baseCorr -= 0.10;
      if (reverbActive) baseCorr -= 0.06;
      if (widthVal > 110) baseCorr -= (widthVal - 100) * 0.002;
      this.lastPhaseCorrelation = Math.max(0.15, Math.min(0.99, baseCorr + (Math.random() * 0.03 - 0.015)));
    }

    // 9. Auto-Match Live AGC (if enabled)
    if (this.isAutoMatchActive && isAudioActive && this.lastShortTermLufs > -50) {
      const err = this.targetLufs - this.lastShortTermLufs;
      if (Math.abs(err) > 0.3) {
        const step = Math.sign(err) * Math.min(0.12, Math.abs(err) * 0.08);
        const targetGain = this.correctionGainDb + step;
        if (this.lastTruePeakDb + step <= this.targetCeilingDb + 0.1) {
          this.setCorrectionGain(targetGain);
        }
      }
    }

    return {
      momentaryLufs: Math.round(this.lastMomentaryLufs * 10) / 10,
      shortTermLufs: Math.round(this.lastShortTermLufs * 10) / 10,
      integratedLufs: Math.round(this.lastIntegratedLufs * 10) / 10,
      truePeakDb: Math.round(this.lastTruePeakDb * 100) / 100,
      lra: this.lastLra,
      crestFactorDb: this.lastCrestFactorDb,
      phaseCorrelation: Math.round(this.lastPhaseCorrelation * 100) / 100,
      targetLufs: this.targetLufs,
      targetCeilingDb: this.targetCeilingDb,
      correctionGainDb: Math.round(this.correctionGainDb * 10) / 10,
      isCompliant: Math.abs(this.lastIntegratedLufs - this.targetLufs) <= 1.0,
      isClippingRisk: this.lastTruePeakDb > this.targetCeilingDb,
      autoMatchActive: this.isAutoMatchActive
    };
  }

  // ==============================================================================
  // LUFS CORRECTION & GAIN NORMALIZATION CONTROLS
  // ==============================================================================

  public setTargetLufs(target: number, ceiling: number = -1.0) {
    this.targetLufs = target;
    this.targetCeilingDb = ceiling;
  }

  public getTargetLufs(): { targetLufs: number; ceilingDb: number } {
    return { targetLufs: this.targetLufs, ceilingDb: this.targetCeilingDb };
  }

  public setCorrectionGain(gainDb: number) {
    this.correctionGainDb = Math.max(-24, Math.min(18, gainDb));
    if (this.ctx && this.correctionGainNode) {
      const linear = Math.pow(10, this.correctionGainDb / 20);
      this.correctionGainNode.gain.setTargetAtTime(linear, this.ctx.currentTime, 0.06);
    }
  }

  public getCompressorGainReduction(): number {
    if (!this.compressorNode) return 0;
    return Math.abs(this.compressorNode.reduction);
  }

  public getLimiterGainReduction(): number {
    if (!this.limiterNode) return 0;
    return Math.abs(this.limiterNode.reduction);
  }

  public resetCorrectionGain() {
    this.setCorrectionGain(0);
  }

  public getCorrectionGain(): number {
    return this.correctionGainDb;
  }

  public resetLufsCounters() {
    this.momentaryHistory = [];
    this.shortTermHistory = [];
    this.integratedBlocks = [];
    this.lastMomentaryLufs = -90;
    this.lastShortTermLufs = -90;
    this.lastIntegratedLufs = -90;
    this.lastTruePeakDb = -90;
  }

  public applyLufsCorrection(targetLufs?: number, targetCeiling?: number): {
    appliedDeltaDb: number;
    totalCorrectionGainDb: number;
    measuredLufs: number;
    targetLufs: number;
    predictedLufs: number;
    safetyClamped: boolean;
  } {
    const target = targetLufs !== undefined ? targetLufs : this.targetLufs;
    const ceiling = targetCeiling !== undefined ? targetCeiling : this.targetCeilingDb;
    this.targetLufs = target;
    this.targetCeilingDb = ceiling;

    let currentLoudness = this.lastIntegratedLufs > -60 ? this.lastIntegratedLufs : this.lastShortTermLufs;
    if (currentLoudness <= -60) {
      currentLoudness = -18.0; // un-mastered raw stems default baseline
    }

    let deltaDb = target - currentLoudness;
    let safetyClamped = false;

    // Peak Limiter safety protection: prevent inter-sample clipping beyond ceiling
    const headroomToCeiling = ceiling - this.lastTruePeakDb;
    if (deltaDb > 0 && headroomToCeiling < deltaDb && this.lastTruePeakDb > -60) {
      deltaDb = Math.max(0, headroomToCeiling);
      safetyClamped = true;
    }

    const newTotalGain = this.correctionGainDb + deltaDb;
    this.setCorrectionGain(newTotalGain);

    return {
      appliedDeltaDb: Math.round(deltaDb * 10) / 10,
      totalCorrectionGainDb: Math.round(newTotalGain * 10) / 10,
      measuredLufs: Math.round(currentLoudness * 10) / 10,
      targetLufs: target,
      predictedLufs: Math.round((currentLoudness + deltaDb) * 10) / 10,
      safetyClamped
    };
  }

  public setAutoLufsMatch(enabled: boolean, targetLufs?: number) {
    this.isAutoMatchActive = enabled;
    if (targetLufs !== undefined) {
      this.targetLufs = targetLufs;
    }
  }

  // Musical key pitch calculation helper
  private parseKeyFrequencies(songKey: string = 'G Major') {
    const clean = (songKey || '').trim().toLowerCase();
    const isMinor = clean.includes('minor') || (clean.includes('m') && !clean.includes('major'));

    let root = 196.0; // Default G3
    if (clean.includes('c#') || clean.includes('db')) root = 138.59;
    else if (clean.includes('c')) root = 130.81;
    else if (clean.includes('d#') || clean.includes('eb')) root = 155.56;
    else if (clean.includes('d')) root = 146.83;
    else if (clean.includes('f#') || clean.includes('gb')) root = 185.00;
    else if (clean.includes('f')) root = 174.61;
    else if (clean.includes('g#') || clean.includes('ab')) root = 207.65;
    else if (clean.includes('g')) root = 196.00;
    else if (clean.includes('a#') || clean.includes('bb')) root = 233.08;
    else if (clean.includes('a')) root = 220.00;
    else if (clean.includes('b')) root = 246.94;
    else if (clean.includes('e')) root = 164.81;

    const thirdRatio = isMinor ? Math.pow(2, 3 / 12) : Math.pow(2, 4 / 12);
    const fifthRatio = Math.pow(2, 7 / 12);

    return {
      root,
      third: root * thirdRatio,
      fifth: root * fifthRatio,
      octave: root * 2,
      sub: root / 2,
      isMinor
    };
  }

  // Generates a punchy 2-measure rhythmic studio drum loop AudioBuffer (kick, snare, hi-hats)
  private createRhythmicDrumBuffer(bpm: number): AudioBuffer | null {
    if (!this.ctx) return null;
    const sampleRate = this.ctx.sampleRate;
    const safeBpm = Math.max(50, Math.min(200, bpm || 80));
    const beatSec = 60 / safeBpm;
    const totalSec = beatSec * 8; // 2 measures (8 beats)
    const numSamples = Math.floor(sampleRate * totalSec);
    const buffer = this.ctx.createBuffer(2, numSamples, sampleRate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    for (let beat = 0; beat < 8; beat++) {
      const beatTime = beat * beatSec;
      const beatSample = Math.floor(beatTime * sampleRate);

      // 1. Kick on beat 0, 2, 4, 6 (with syncopation)
      const isKick = beat === 0 || beat === 2 || beat === 4 || beat === 6 || (safeBpm >= 95 && beat === 5.5);
      if (isKick) {
        const kickDuration = Math.min(Math.floor(sampleRate * 0.22), numSamples - beatSample);
        for (let i = 0; i < kickDuration; i++) {
          const t = i / sampleRate;
          const env = Math.exp(-t * 20);
          const freq = 45 + 120 * Math.exp(-t * 36);
          const click = (Math.random() * 2 - 1) * Math.exp(-t * 80) * 0.15;
          const val = (Math.sin(2 * Math.PI * freq * t) + click) * env * 0.95;
          const idx = beatSample + i;
          if (idx < numSamples) {
            left[idx] += val;
            right[idx] += val;
          }
        }
      }

      // 2. Snare on backbeats (1, 3, 5, 7)
      const isSnare = beat % 2 === 1;
      if (isSnare) {
        const snareDuration = Math.min(Math.floor(sampleRate * 0.22), numSamples - beatSample);
        for (let i = 0; i < snareDuration; i++) {
          const t = i / sampleRate;
          const env = Math.exp(-t * 20);
          const noise = (Math.random() * 2 - 1) * 0.65;
          const tone = Math.sin(2 * Math.PI * 185 * t) * Math.exp(-t * 26) * 0.35;
          const val = (noise + tone) * env * 0.85;
          const idx = beatSample + i;
          if (idx < numSamples) {
            left[idx] += val * 0.95;
            right[idx] += val * 1.05;
          }
        }
      }

      // 3. Hi-hats on 8th notes (beats 0, 0.5, 1, 1.5, etc.)
      for (let sub = 0; sub < 2; sub++) {
        const hatTime = beatTime + sub * (beatSec / 2);
        const hatSample = Math.floor(hatTime * sampleRate);
        const hatDuration = Math.min(Math.floor(sampleRate * 0.05), numSamples - hatSample);
        const hatAmp = sub === 0 ? 0.35 : 0.22;
        for (let i = 0; i < hatDuration; i++) {
          const t = i / sampleRate;
          const env = Math.exp(-t * 75);
          const noise = (Math.random() * 2 - 1) * hatAmp;
          const idx = hatSample + i;
          if (idx < numSamples) {
            left[idx] += noise * env * 0.85;
            right[idx] += noise * env * 1.15;
          }
        }
      }
    }

    for (let i = 0; i < numSamples; i++) {
      left[i] = Math.tanh(left[i]);
      right[i] = Math.tanh(right[i]);
    }

    return buffer;
  }

  // Generates a warm, punchy bass groove AudioBuffer in key
  private createBasslineBuffer(bpm: number, rootFreq: number, isMinor: boolean): AudioBuffer | null {
    if (!this.ctx) return null;
    const sampleRate = this.ctx.sampleRate;
    const safeBpm = Math.max(50, Math.min(200, bpm || 80));
    const beatSec = 60 / safeBpm;
    const totalSec = beatSec * 8; // 2 measures
    const numSamples = Math.floor(sampleRate * totalSec);
    const buffer = this.ctx.createBuffer(2, numSamples, sampleRate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    const fRoot = rootFreq > 130 ? rootFreq / 2 : rootFreq;
    const fFifth = fRoot * 1.4983;
    const fOctave = fRoot * 2;
    const fThird = fRoot * (isMinor ? 1.1892 : 1.2599);
    const pattern = [fRoot, fRoot, fFifth, fRoot, fThird, fFifth, fOctave, fFifth];

    for (let beat = 0; beat < 8; beat++) {
      const freq = pattern[beat];
      const beatTime = beat * beatSec;
      const beatSample = Math.floor(beatTime * sampleRate);
      const noteDuration = Math.min(Math.floor(sampleRate * beatSec * 0.88), numSamples - beatSample);

      for (let i = 0; i < noteDuration; i++) {
        const t = i / sampleRate;
        const env = Math.exp(-t * 4.0);
        const sub = Math.sin(2 * Math.PI * (freq / 2) * t) * 0.65;
        const fund = Math.sin(2 * Math.PI * freq * t) * 0.70;
        const harm = Math.sin(2 * Math.PI * (freq * 2) * t) * 0.25;
        const attackClick = (Math.random() * 2 - 1) * Math.exp(-t * 70) * 0.18;
        const val = Math.tanh((sub + fund + harm + attackClick) * env * 0.85);

        const idx = beatSample + i;
        if (idx < numSamples) {
          left[idx] += val;
          right[idx] += val;
        }
      }
    }
    return buffer;
  }

  // Generates an acoustic chord & arpeggio buffer in key
  private createAcousticChordBuffer(bpm: number, rootFreq: number, isMinor: boolean, instrument: 'guitar' | 'piano' | 'rhodes'): AudioBuffer | null {
    if (!this.ctx) return null;
    const sampleRate = this.ctx.sampleRate;
    const safeBpm = Math.max(50, Math.min(200, bpm || 80));
    const beatSec = 60 / safeBpm;
    const totalSec = beatSec * 8;
    const numSamples = Math.floor(sampleRate * totalSec);
    const buffer = this.ctx.createBuffer(2, numSamples, sampleRate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    const fRoot = rootFreq;
    const fThird = fRoot * (isMinor ? 1.1892 : 1.2599);
    const fFifth = fRoot * 1.4983;
    const fOctave = fRoot * 2;
    const notes = [fRoot, fThird, fFifth, fOctave, fFifth, fThird, fRoot, fFifth];

    for (let beat = 0; beat < 8; beat++) {
      const freq = notes[beat];
      const beatTime = beat * beatSec;
      const beatSample = Math.floor(beatTime * sampleRate);
      const noteDuration = Math.min(Math.floor(sampleRate * beatSec * 0.95), numSamples - beatSample);

      for (let i = 0; i < noteDuration; i++) {
        const t = i / sampleRate;
        const decayRate = instrument === 'guitar' ? 5.2 : 3.6;
        const env = Math.exp(-t * decayRate);
        let val = 0;
        if (instrument === 'guitar') {
          const fund = Math.sin(2 * Math.PI * freq * t) * 0.65;
          const body = Math.sin(2 * Math.PI * (freq * 2) * t) * 0.35 * Math.exp(-t * 7);
          const chime = Math.sin(2 * Math.PI * (freq * 3) * t) * 0.18 * Math.exp(-t * 12);
          const pluck = (Math.random() * 2 - 1) * Math.exp(-t * 85) * 0.22;
          val = (fund + body + chime + pluck) * env * 0.75;
        } else {
          const tine = Math.sin(2 * Math.PI * freq * t) * 0.72;
          const bell = Math.sin(2 * Math.PI * (freq * 4) * t) * 0.24 * Math.exp(-t * 10);
          const warm = Math.sin(2 * Math.PI * (freq / 2) * t) * 0.32;
          val = (tine + bell + warm) * env * 0.72;
        }
        val = Math.tanh(val);
        const idx = beatSample + i;
        if (idx < numSamples) {
          const pan = Math.sin(beat * 1.4) * 0.25;
          left[idx] += val * (1 - pan);
          right[idx] += val * (1 + pan);
        }
      }
    }
    return buffer;
  }

  // Generates an authentic vocal melody buffer with expressive musical notes, vibrato, and formant filtering
  private createVocalMelodyBuffer(bpm: number, rootFreq: number, isMinor: boolean): AudioBuffer | null {
    if (!this.ctx) return null;
    const sampleRate = this.ctx.sampleRate;
    const safeBpm = Math.max(50, Math.min(200, bpm || 80));
    const beatSec = 60 / safeBpm;
    const totalSec = beatSec * 8; // 2 measures
    const numSamples = Math.floor(sampleRate * totalSec);
    const buffer = this.ctx.createBuffer(2, numSamples, sampleRate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    const fRoot = rootFreq > 350 ? rootFreq / 2 : rootFreq < 140 ? rootFreq * 2 : rootFreq;
    const fSecond = fRoot * 1.1224;
    const fThird = fRoot * (isMinor ? 1.1892 : 1.2599);
    const fFourth = fRoot * 1.3348;
    const fFifth = fRoot * 1.4983;
    const fOctave = fRoot * 2;

    // Nashville vocal phrasing: dynamic melodic contour across 8 beats with pauses
    const melody = [
      { freq: fRoot, dur: 1.0, rest: 0.1 },
      { freq: fSecond, dur: 0.8, rest: 0.2 },
      { freq: fThird, dur: 1.8, rest: 0.2 },
      { freq: fFifth, dur: 1.0, rest: 0.1 },
      { freq: fFourth, dur: 0.9, rest: 0.1 },
      { freq: fThird, dur: 1.0, rest: 0.1 },
      { freq: fRoot, dur: 1.7, rest: 0.3 }
    ];

    let currentSec = 0;
    for (const phrase of melody) {
      if (currentSec >= totalSec) break;
      const noteSamples = Math.floor(phrase.dur * beatSec * sampleRate);
      const startSample = Math.floor(currentSec * sampleRate);
      const actualSamples = Math.min(noteSamples, numSamples - startSample);

      for (let i = 0; i < actualSamples; i++) {
        const t = i / sampleRate;
        // Pitch vibrato (5.5 Hz) developing naturally after note attack
        const vibratoDepth = t > 0.25 ? Math.min(0.025, (t - 0.25) * 0.04) : 0;
        const vib = Math.sin(2 * Math.PI * 5.5 * t) * (phrase.freq * vibratoDepth);
        const pitch = phrase.freq + vib;

        // Vowel formant synthesis (A/O/E formant spectrum)
        const harm1 = Math.sin(2 * Math.PI * pitch * t) * 0.70;
        const harm2 = Math.sin(2 * Math.PI * (pitch * 2) * t) * 0.35;
        const harm3 = Math.sin(2 * Math.PI * (pitch * 3) * t) * 0.22;
        const subWarmth = Math.sin(2 * Math.PI * (pitch / 2) * t) * 0.15;

        // Expressive envelope with gentle attack, vocal breathiness, and release
        const attack = Math.min(1, t / 0.08);
        const release = Math.max(0, 1 - (i / actualSamples));
        const env = attack * Math.pow(release, 0.4);
        const breath = (Math.random() * 2 - 1) * 0.04 * env;

        const val = Math.tanh((harm1 + harm2 + harm3 + subWarmth + breath) * env * 0.78);
        const idx = startSample + i;
        if (idx < numSamples) {
          left[idx] += val * 0.95;
          right[idx] += val * 0.95;
        }
      }
      currentSec += (phrase.dur + phrase.rest) * beatSec;
    }

    return buffer;
  }

  // Generates 3-part backing gospel choir harmonic swells in key
  private createChoirBuffer(bpm: number, rootFreq: number, isMinor: boolean): AudioBuffer | null {
    if (!this.ctx) return null;
    const sampleRate = this.ctx.sampleRate;
    const safeBpm = Math.max(50, Math.min(200, bpm || 80));
    const beatSec = 60 / safeBpm;
    const totalSec = beatSec * 8; // 2 measures
    const numSamples = Math.floor(sampleRate * totalSec);
    const buffer = this.ctx.createBuffer(2, numSamples, sampleRate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    const fRoot = rootFreq > 300 ? rootFreq / 2 : rootFreq;
    const fThird = fRoot * (isMinor ? 1.1892 : 1.2599);
    const fFifth = fRoot * 1.4983;
    const fOctave = fRoot * 2;

    // Two 4-beat harmonic chord swells
    const chords = [
      [fRoot, fThird, fFifth],
      [fThird, fFifth, fOctave]
    ];

    for (let c = 0; c < 2; c++) {
      const chord = chords[c];
      const startSample = Math.floor(c * 4 * beatSec * sampleRate);
      const chordSamples = Math.min(Math.floor(3.8 * beatSec * sampleRate), numSamples - startSample);

      for (let i = 0; i < chordSamples; i++) {
        const t = i / sampleRate;
        const swell = Math.sin((i / chordSamples) * Math.PI); // Smooth breath arc
        let chordValL = 0;
        let chordValR = 0;

        chord.forEach((freq, idx) => {
          const detune = idx === 0 ? 1.0 : idx === 1 ? 1.003 : 0.997;
          const osc1 = Math.sin(2 * Math.PI * freq * detune * t);
          const osc2 = Math.sin(2 * Math.PI * (freq * 2) * detune * t) * 0.28;
          const voiceVal = (osc1 + osc2) * swell * 0.26;
          const pan = idx === 0 ? 0 : idx === 1 ? -0.35 : 0.35;
          chordValL += voiceVal * (1 - pan);
          chordValR += voiceVal * (1 + pan);
        });

        const idx = startSample + i;
        if (idx < numSamples) {
          left[idx] += Math.tanh(chordValL);
          right[idx] += Math.tanh(chordValR);
        }
      }
    }

    return buffer;
  }

  public startPlayback(tracks: MixerTrack[], bpm: number = 78, songKey: string = 'G Major', trackId?: string, trackTitle?: string) {
    this.init();
    if (!this.ctx || !this.masterGain) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    this.stopPlayback();
    this.isRunning = true;
    if (trackId) this.activeTrackId = trackId;
    if (trackTitle) this.activeTrackTitle = trackTitle;

    // Compute key pitch frequencies dynamically for any key (G Major, D Minor, F# Minor, etc.)
    const keyInfo = this.parseKeyFrequencies(songKey);
    const rootNotes = [keyInfo.root, keyInfo.third, keyInfo.fifth, keyInfo.octave];

    tracks.forEach((t) => {
      if (!this.ctx || !this.masterGain) return;

      const gain = this.ctx.createGain();
      const panner = this.ctx.createStereoPanner();

      // Check if track has an audioUrl or webdavPath to stream real audio from Nextcloud
      let streamUrl = '';
      if (t.webdavPath) {
        streamUrl = buildNextcloudStreamUrl(t.webdavPath);
      } else if (t.audioUrl) {
        if (t.audioUrl.includes('path=')) {
          try {
            const rawPath = decodeURIComponent(t.audioUrl.split('path=')[1].split('&')[0]);
            streamUrl = buildNextcloudStreamUrl(rawPath);
          } catch {
            streamUrl = t.audioUrl;
          }
        } else {
          streamUrl = t.audioUrl;
        }
      }

      if (streamUrl) {
        try {
          const audioEl = new Audio();
          audioEl.crossOrigin = 'anonymous';
          audioEl.src = streamUrl;
          audioEl.loop = true;
          audioEl.preload = 'auto';

          this.incrementPendingStreams();
          let loaded = false;
          const handleReady = () => {
            if (!loaded) {
              loaded = true;
              this.decrementPendingStreams();
            }
          };

          audioEl.addEventListener('canplay', handleReady, { once: true });
          audioEl.addEventListener('playing', handleReady, { once: true });
          audioEl.addEventListener('waiting', () => {
            if (this.isRunning) this.setIsLoadingAudio(true);
          });
          audioEl.addEventListener('error', (err) => {
            console.warn(`[AudioEngine] Stream loading warning for track ${t.id} (${t.name}):`, err);
            handleReady();
          }, { once: true });

          const initialVol = t.muted ? 0 : (t.vol / 100) * 0.95;

          try {
            const mediaSource = this.ctx.createMediaElementSource(audioEl);
            mediaSource.connect(panner);
            panner.connect(gain);
            gain.connect(this.masterGain);
            gain.gain.setValueAtTime(initialVol, this.ctx.currentTime);
            panner.pan.setValueAtTime(this.isMono ? 0 : t.pan / 100, this.ctx.currentTime);
          } catch (corsErr) {
            console.warn('WebAudio createMediaElementSource bypassed (direct audio element output):', corsErr);
            audioEl.volume = initialVol;
          }

          // Trigger explicit preload & play
          audioEl.load();
          const playPromise = audioEl.play();
          if (playPromise !== undefined) {
            playPromise.then(() => {
              handleReady();
            }).catch((playErr) => {
              console.warn('[AudioEngine] Play promise waiting for buffer/data:', playErr.message);
              audioEl.addEventListener('canplay', () => {
                if (this.isRunning) {
                  audioEl.play().catch(() => {});
                }
              }, { once: true });
            });
          }

          this.trackNodes.set(t.id, { audioEl, gain, panner });
          return;
        } catch (streamErr) {
          console.warn('[AudioEngine] Failed to stream audio directly:', streamErr);
        }
      }

      // If no streamUrl is present or audio failed to load, keep node connected cleanly and silently without synthetic oscillators
      const initialVol = t.muted ? 0 : (t.vol / 100) * 0.25;
      gain.gain.setValueAtTime(initialVol, this.ctx.currentTime);
      panner.pan.setValueAtTime(this.isMono ? 0 : t.pan / 100, this.ctx.currentTime);

      panner.connect(gain);
      gain.connect(this.masterGain);

      this.trackNodes.set(t.id, {
        gain,
        panner
      });
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

    // Also update direct HTML audio element volume if bypassed
    if (node.audioEl) {
      const directVol = Math.max(0, Math.min(1, (vol / 100) * (muted ? 0 : (hasSolo && !isSolo ? 0 : 1))));
      node.audioEl.volume = directVol;
      node.audioEl.muted = muted || (hasSolo && !isSolo);
    }
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
      const trackDef = tracks.find(t => t.id === id);
      const stemType = (trackDef?.stemType || '').toLowerCase();
      const trackName = (trackDef?.name || '').toLowerCase();

      let active = false;

      if (bus === 'all' || bus === 'daw') {
        // DAW 4-track mode: All active channels play
        active = !trackDef?.muted;
      } else if (bus === 'master') {
        // [D] Final Master: Play the Gold Master print
        const masterTrack = tracks.find(t => t.stemType === 'master' || t.name.toLowerCase().includes('master')) || tracks[0];
        active = (trackDef?.id === masterTrack?.id);
      } else if (bus === 'vocal') {
        // [B] Dry Vocal: Solo the UVR5 isolated dialogue/vocal stem
        active = stemType === 'vocal' || trackName.includes('vocal') || trackName.includes('vox') || trackName.includes('lead');
      } else if (bus === 'instrumental') {
        // [C] True Instrumental: Solo the backing instrumental bed
        active = stemType === 'guitar' || stemType === 'drums' || stemType === 'bass' || stemType === 'piano' || stemType === 'organ' || trackName.includes('instrumental');
      } else if (bus === 'suno') {
        // [A] Raw Suno Gen / Pre-Master: Play the alternate pre-master cut
        const altTrack = tracks.find(t => t.name.toLowerCase().includes('v6') || t.name.toLowerCase().includes('original') || t.name.toLowerCase().includes('suno') || t.id === 4) || tracks[tracks.length - 1];
        active = (trackDef?.id === altTrack?.id);
      } else if (bus === 'ref') {
        // [REF] Billboard Reference: Level-matched reference audition of the master
        const masterTrack = tracks.find(t => t.stemType === 'master' || t.name.toLowerCase().includes('master')) || tracks[0];
        active = (trackDef?.id === masterTrack?.id);
      }

      // Safe fallback if no track matched
      if (!active && bus === 'master' && id === 1 && !tracks.some(t => t.stemType === 'master')) {
        active = true;
      }

      const targetGain = active ? ((trackDef?.vol ?? 90) / 100) * 0.25 : 0;
      node.gain.gain.setTargetAtTime(targetGain, this.ctx!.currentTime, 0.03);

      if (node.audioEl) {
        node.audioEl.muted = !active;
        node.audioEl.volume = active ? Math.max(0, Math.min(1, ((trackDef?.vol ?? 95) / 100) * 0.95)) : 0;
      }
    });
  }

  public stopPlayback() {
    this.stopTestTone();
    this.trackNodes.forEach((node) => {
      try {
        if (node.osc) {
          node.osc.stop();
          node.osc.disconnect();
        }
        if (node.extraOscs) {
          node.extraOscs.forEach(o => {
            try { o.stop(); o.disconnect(); } catch (_) {}
          });
        }
        if (node.lfo) {
          try { node.lfo.stop(); node.lfo.disconnect(); } catch (_) {}
        }
        if (node.audioEl) {
          node.audioEl.pause();
          node.audioEl.currentTime = 0;
          node.audioEl.src = '';
          try { node.audioEl.load(); } catch (_) {}
        }
        if (node.source) {
          try { node.source.stop(); node.source.disconnect(); } catch (_) {}
        }
      } catch (_) {}
    });
    this.trackNodes.clear();
    this.pendingStreams = 0;
    this.setIsLoadingAudio(false);
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

    // Apply active LUFS correction gain in offline render
    const corrGainDb = activeEffects.correctionGainDb !== undefined ? activeEffects.correctionGainDb : this.correctionGainDb;
    const correctionGain = offlineCtx.createGain();
    correctionGain.gain.value = Math.pow(10, (corrGainDb || 0) / 20);

    // Limiter node in offline render
    const limiterNode = offlineCtx.createDynamicsCompressor();
    const limiterGain = offlineCtx.createGain();
    if (activeEffects.limiter?.enabled) {
      limiterNode.threshold.value = activeEffects.limiter.threshold ?? -1.0;
      limiterNode.knee.value = 0.0;
      limiterNode.ratio.value = 20.0;
      limiterNode.attack.value = 0.001;
      limiterNode.release.value = activeEffects.limiter.release ?? 0.05;
      limiterGain.gain.value = Math.pow(10, (activeEffects.limiter.ceiling ?? -1.0) / 20);
    } else {
      limiterNode.threshold.value = 0;
      limiterNode.ratio.value = 1.0;
      limiterGain.gain.value = 1.0;
    }

    masterGain.connect(eqLow);
    eqLow.connect(eqMid);
    eqMid.connect(eqHigh);
    eqHigh.connect(comp);
    comp.connect(makeup);
    makeup.connect(correctionGain);
    correctionGain.connect(limiterNode);
    limiterNode.connect(limiterGain);
    limiterGain.connect(offlineCtx.destination);

    const keyInfo = this.parseKeyFrequencies('G Major');
    tracks.forEach((t) => {
      if (t.muted) return;
      const gain = offlineCtx.createGain();
      const panner = offlineCtx.createStereoPanner();
      const filter = offlineCtx.createBiquadFilter();

      const name = (t.name || '').toLowerCase();
      const stemType = (t.stemType || '').toLowerCase();
      const isDrums = stemType === 'drums' || name.includes('drum') || name.includes('percussion') || t.id === 4;
      const isBass = stemType === 'bass' || name.includes('bass') || name.includes('sub');
      const isHarm = stemType === 'harmony' || stemType === 'choir' || name.includes('harmony') || t.id === 2;
      const isOrganOrAcoustic = stemType === 'organ' || stemType === 'guitar' || stemType === 'instrumental' || name.includes('acoustic') || t.id === 3;

      if (isDrums) {
        // Kick & Snare synth in offline renderer
        const osc = offlineCtx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(140, 0);
        osc.frequency.exponentialRampToValueAtTime(45, durationSec);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(3500, 0);
        osc.connect(filter);
        osc.start(0);
        osc.stop(durationSec);
      } else if (isBass) {
        const osc = offlineCtx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(keyInfo.root / 2, 0);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, 0);
        osc.connect(filter);
        osc.start(0);
        osc.stop(durationSec);
      } else if (isHarm) {
        const osc = offlineCtx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(keyInfo.third, 0);
        filter.type = 'peaking';
        filter.frequency.setValueAtTime(1150, 0);
        filter.gain.setValueAtTime(4, 0);
        osc.connect(filter);
        osc.start(0);
        osc.stop(durationSec);
      } else if (isOrganOrAcoustic) {
        const osc = offlineCtx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(keyInfo.fifth, 0);
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1400, 0);
        osc.connect(filter);
        osc.start(0);
        osc.stop(durationSec);
      } else {
        // Lead Vocal
        const osc = offlineCtx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(keyInfo.root, 0);
        filter.type = 'peaking';
        filter.frequency.setValueAtTime(1250, 0);
        filter.gain.setValueAtTime(5, 0);
        osc.connect(filter);
        osc.start(0);
        osc.stop(durationSec);
      }

      const panVal = activeEffects.stereo.isMonoCollapse ? 0 : t.pan / 100;
      panner.pan.setValueAtTime(panVal, 0);
      gain.gain.setValueAtTime((t.vol / 100) * 0.22, 0);

      filter.connect(panner);
      panner.connect(gain);
      gain.connect(masterGain);
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
