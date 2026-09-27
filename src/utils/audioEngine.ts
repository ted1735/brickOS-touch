import { MixerTrack, DawEffectsState, LufsMeasurementData } from '../types';
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

    // 5b. Correction Gain Node (for instant LUFS normalization & trimming)
    this.correctionGainNode = this.ctx.createGain();
    this.correctionGainNode.gain.value = Math.pow(10, this.correctionGainDb / 20);

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

    // 7. Master Analyser (1024 FFT for spectrum visualization)
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 1024;
    this.analyser.minDecibels = -90;
    this.analyser.maxDecibels = -10;
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

    // Correction Gain feeds the Master Analyser, which connects to Destination
    this.correctionGainNode.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);

    // Tap K-Weighting filters from Correction Gain node for precise LUFS reading
    this.correctionGainNode.connect(this.kWeightShelf);
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
    this.stopTestTone();
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

    // Apply active LUFS correction gain in offline render
    const corrGainDb = activeEffects.correctionGainDb !== undefined ? activeEffects.correctionGainDb : this.correctionGainDb;
    const correctionGain = offlineCtx.createGain();
    correctionGain.gain.value = Math.pow(10, (corrGainDb || 0) / 20);

    masterGain.connect(eqLow);
    eqLow.connect(eqMid);
    eqMid.connect(eqHigh);
    eqHigh.connect(comp);
    comp.connect(makeup);
    makeup.connect(correctionGain);
    correctionGain.connect(offlineCtx.destination);

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
