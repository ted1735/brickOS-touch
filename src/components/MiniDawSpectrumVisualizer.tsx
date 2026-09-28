import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Activity,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Sliders,
  Volume2,
  Waves,
  Eye,
  BarChart2,
  TrendingUp,
  Compass,
  Zap,
  Radio
} from 'lucide-react';
import { audioMiniDaw } from '../utils/audioEngine';

export type VisualizerMode = 'bars' | 'curve' | 'waterfall' | 'hybrid';
export type VisualizerTheme = 'cyber' | 'amber' | 'phosphor' | 'ice';

interface MiniDawSpectrumVisualizerProps {
  analyser: AnalyserNode | null;
  isPlaying: boolean;
  isDarkMode?: boolean;
  trackTitle?: string;
  bpm?: number;
  keySignature?: string;
}

// Frequency band definitions for audio engineering reference
const FREQ_BANDS = [
  { name: 'SUB', min: 20, max: 60, color: 'text-indigo-400', desc: 'Rumble & Sub-Bass' },
  { name: 'BASS', min: 60, max: 250, color: 'text-sky-400', desc: 'Kick & Bassline Punch' },
  { name: 'LOW-MID', min: 250, max: 500, color: 'text-teal-400', desc: 'Warmth / Mud Check' },
  { name: 'MID', min: 500, max: 2000, color: 'text-emerald-400', desc: 'Vocal Body & Lead' },
  { name: 'HIGH-MID', min: 2000, max: 4000, color: 'text-amber-400', desc: 'Clarity & Consonants' },
  { name: 'PRESENCE', min: 4000, max: 6000, color: 'text-orange-400', desc: 'Edge & Attack' },
  { name: 'BRILLIANCE', min: 6000, max: 20000, color: 'text-rose-400', desc: 'Air & Hi-Hat Sheen' },
];

const GRID_FREQUENCIES = [20, 50, 100, 250, 500, 1000, 2000, 5000, 10000, 20000];
const GRID_DB = [0, -6, -12, -24, -36, -48, -60, -80];

const NOTE_STRINGS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function frequencyToNote(freq: number): { note: string; octave: number; cents: number } {
  if (freq < 16) return { note: '---', octave: 0, cents: 0 };
  const noteNum = 12 * (Math.log2(freq / 440)) + 69;
  const rounded = Math.round(noteNum);
  const cents = Math.round((noteNum - rounded) * 100);
  const noteIndex = ((rounded % 12) + 12) % 12;
  const octave = Math.floor(rounded / 12) - 1;
  return {
    note: NOTE_STRINGS[noteIndex],
    octave,
    cents
  };
}

export const MiniDawSpectrumVisualizer: React.FC<MiniDawSpectrumVisualizerProps> = ({
  analyser,
  isPlaying,
  isDarkMode = true,
  trackTitle = 'Master Stem Sum',
  bpm = 100,
  keySignature = 'A Minor'
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // User control states
  const [mode, setMode] = useState<VisualizerMode>('bars');
  const [theme, setTheme] = useState<VisualizerTheme>('cyber');
  const [smoothing, setSmoothing] = useState<number>(0.82);
  const [isFrozen, setIsFrozen] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [showPeakCaps, setShowPeakCaps] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [testToneActive, setTestToneActive] = useState<string | null>(null);

  // Real-time measurements HUD
  const [peakFrequency, setPeakFrequency] = useState<number>(0);
  const [peakDb, setPeakDb] = useState<number>(-90);
  const [rmsLevel, setRmsLevel] = useState<number>(-90);

  // Mouse hover coordinate for cursor crosshair readout
  const [hoverInfo, setHoverInfo] = useState<{
    active: boolean;
    x: number;
    y: number;
    freq: number;
    db: number;
    note: string;
    bandName: string;
  } | null>(null);

  // Internal peak hold arrays across animation frames
  const peaksRef = useRef<Float32Array>(new Float32Array(128));
  const peakHoldCountersRef = useRef<Int32Array>(new Int32Array(128));
  const animationFrameRef = useRef<number | null>(null);
  const frozenDataRef = useRef<{ freqData: Uint8Array; timeData: Uint8Array } | null>(null);

  // Spectrogram historical buffer (rolling vertical slices)
  const spectrogramHistoryRef = useRef<Uint8Array[]>([]);

  // Apply smoothing to audio engine
  useEffect(() => {
    audioMiniDaw.setAnalyserSmoothing(smoothing);
  }, [smoothing]);

  // Handle test tone generator
  const handleToggleTestTone = (type: '1k' | '440' | 'pink' | 'sweep') => {
    if (testToneActive === type) {
      audioMiniDaw.stopTestTone();
      setTestToneActive(null);
    } else {
      audioMiniDaw.playTestTone(type);
      setTestToneActive(type);
    }
  };

  const handleResetPeaks = () => {
    peaksRef.current.fill(0);
    peakHoldCountersRef.current.fill(0);
  };

  // Convert logarithmic frequency to horizontal pixel X
  const freqToX = useCallback((freq: number, width: number): number => {
    const minF = 20;
    const maxF = 20000;
    const clamped = Math.max(minF, Math.min(maxF, freq));
    const logMin = Math.log10(minF);
    const logMax = Math.log10(maxF);
    return ((Math.log10(clamped) - logMin) / (logMax - logMin)) * width;
  }, []);

  // Convert horizontal pixel X to logarithmic frequency
  const xToFreq = useCallback((x: number, width: number): number => {
    const minF = 20;
    const maxF = 20000;
    const logMin = Math.log10(minF);
    const logMax = Math.log10(maxF);
    const clampedX = Math.max(0, Math.min(width, x));
    return Math.pow(10, logMin + (clampedX / width) * (logMax - logMin));
  }, []);

  // Convert amplitude [0..255] or dB [-90..0] to vertical Y
  const ampToY = useCallback((normalizedVal: number, height: number): number => {
    // normalizedVal in 0..1 (where 0 is -90dB and 1 is 0dB)
    const margin = 18;
    const usableH = height - margin * 2;
    return height - margin - normalizedVal * usableH;
  }, []);

  // Theme color palette generator
  const getThemeColors = useCallback((t: VisualizerTheme, ctx: CanvasRenderingContext2D, height: number) => {
    if (t === 'amber') {
      const grad = ctx.createLinearGradient(0, height, 0, 0);
      grad.addColorStop(0, '#78350f'); // deep amber
      grad.addColorStop(0.4, '#d97706'); // warm amber
      grad.addColorStop(0.8, '#f59e0b'); // bright gold
      grad.addColorStop(1, '#fef08a'); // soft white peak
      return {
        gradient: grad,
        peakColor: '#fef08a',
        glowColor: 'rgba(245, 158, 11, 0.45)',
        lineColor: '#fbbf24',
        accentColor: '#f59e0b'
      };
    } else if (t === 'phosphor') {
      const grad = ctx.createLinearGradient(0, height, 0, 0);
      grad.addColorStop(0, '#064e3b'); // dark emerald
      grad.addColorStop(0.5, '#059669'); // emerald
      grad.addColorStop(0.85, '#10b981'); // vivid green
      grad.addColorStop(1, '#a7f3d0'); // phosphor white-green
      return {
        gradient: grad,
        peakColor: '#6ee7b7',
        glowColor: 'rgba(16, 185, 129, 0.45)',
        lineColor: '#34d399',
        accentColor: '#10b981'
      };
    } else if (t === 'ice') {
      const grad = ctx.createLinearGradient(0, height, 0, 0);
      grad.addColorStop(0, '#1e3a8a'); // deep navy
      grad.addColorStop(0.5, '#0284c7'); // sky
      grad.addColorStop(0.85, '#38bdf8'); // light cyan
      grad.addColorStop(1, '#e0f2fe'); // crystal ice
      return {
        gradient: grad,
        peakColor: '#bae6fd',
        glowColor: 'rgba(56, 189, 248, 0.45)',
        lineColor: '#38bdf8',
        accentColor: '#0284c7'
      };
    } else {
      // Default 'cyber' multi-hue
      const grad = ctx.createLinearGradient(0, height, 0, 0);
      grad.addColorStop(0, '#4338ca'); // indigo
      grad.addColorStop(0.25, '#0284c7'); // sky
      grad.addColorStop(0.55, '#06b6d4'); // cyan
      grad.addColorStop(0.8, '#10b981'); // emerald
      grad.addColorStop(0.95, '#fbbf24'); // gold
      grad.addColorStop(1, '#f43f5e'); // crimson red peak
      return {
        gradient: grad,
        peakColor: '#fb7185',
        glowColor: 'rgba(6, 182, 212, 0.45)',
        lineColor: '#38bdf8',
        accentColor: '#06b6d4'
      };
    }
  }, []);

  // Canvas Mouse Move Handler for Hover Crosshair
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (x < 0 || x > rect.width || y < 0 || y > rect.height) {
      setHoverInfo(null);
      return;
    }

    const freq = xToFreq(x, rect.width);
    const margin = 18;
    const usableH = rect.height - margin * 2;
    const clampedY = Math.max(margin, Math.min(rect.height - margin, y));
    const normalizedY = 1 - (clampedY - margin) / usableH;
    const db = -90 + normalizedY * 90;

    const noteData = frequencyToNote(freq);
    const band = FREQ_BANDS.find((b) => freq >= b.min && freq <= b.max) || FREQ_BANDS[0];

    setHoverInfo({
      active: true,
      x,
      y,
      freq: Math.round(freq),
      db: Math.round(db * 10) / 10,
      note: `${noteData.note}${noteData.octave}`,
      bandName: `${band.name} (${band.desc})`
    });
  };

  const handleMouseLeave = () => {
    setHoverInfo(null);
  };

  // Main Render Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let localPeakFreq = 0;
    let localPeakVal = 0;
    let localRmsSum = 0;

    const render = () => {
      const activeAnalyser = analyser || audioMiniDaw.getAnalyser();
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const targetW = Math.max(300, Math.floor(rect.width));
      const targetH = Math.max(120, Math.floor(rect.height));

      // Handle Hi-DPI scaling
      if (canvas.width !== targetW * dpr || canvas.height !== targetH * dpr) {
        canvas.width = targetW * dpr;
        canvas.height = targetH * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      const width = targetW;
      const height = targetH;
      const themeColors = getThemeColors(theme, ctx, height);

      // 1. Dark Studio Background
      ctx.fillStyle = isDarkMode ? '#050811' : '#0b0f19';
      ctx.fillRect(0, 0, width, height);

      // Background subtle gradient vignette
      const bgRadial = ctx.createRadialGradient(width / 2, height / 2, 20, width / 2, height / 2, width * 0.7);
      bgRadial.addColorStop(0, 'rgba(15, 23, 42, 0.4)');
      bgRadial.addColorStop(1, 'rgba(2, 6, 23, 0.95)');
      ctx.fillStyle = bgRadial;
      ctx.fillRect(0, 0, width, height);

      // 2. Frequency Band Regions Header / Indicators
      if (showGrid) {
        FREQ_BANDS.forEach((band) => {
          const xStart = freqToX(band.min, width);
          const xEnd = freqToX(band.max, width);
          const bandW = xEnd - xStart;

          // Subtle band boundary line
          ctx.strokeStyle = 'rgba(51, 65, 85, 0.25)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(xStart, 0);
          ctx.lineTo(xStart, height - 16);
          ctx.stroke();

          // Band label at top
          if (bandW > 35) {
            ctx.fillStyle = 'rgba(148, 163, 184, 0.35)';
            ctx.font = '8px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(band.name, xStart + bandW / 2, 12);
          }
        });

        // 3. Decibel Scale Horizontal Gridlines & Labels
        GRID_DB.forEach((db) => {
          const norm = (db + 90) / 90; // 0..1
          const y = ampToY(norm, height);

          ctx.strokeStyle = db === 0 ? 'rgba(239, 68, 68, 0.4)' : 'rgba(51, 65, 85, 0.35)';
          ctx.setLineDash(db === 0 ? [] : [2, 4]);
          ctx.lineWidth = db === 0 ? 1 : 0.75;
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
          ctx.setLineDash([]);

          // dB Label on right side
          ctx.fillStyle = db === 0 ? 'rgba(239, 68, 68, 0.8)' : 'rgba(100, 116, 139, 0.7)';
          ctx.font = '8px monospace';
          ctx.textAlign = 'right';
          ctx.fillText(`${db > 0 ? '+' : ''}${db}dB`, width - 6, y - 2);
        });

        // 4. Frequency Scale Vertical Gridlines & Labels
        GRID_FREQUENCIES.forEach((freq) => {
          const x = freqToX(freq, width);
          ctx.strokeStyle = 'rgba(51, 65, 85, 0.35)';
          ctx.setLineDash([2, 3]);
          ctx.lineWidth = 0.75;
          ctx.beginPath();
          ctx.moveTo(x, 16);
          ctx.lineTo(x, height - 16);
          ctx.stroke();
          ctx.setLineDash([]);

          // Frequency label at bottom
          ctx.fillStyle = 'rgba(148, 163, 184, 0.75)';
          ctx.font = '8px monospace';
          ctx.textAlign = 'center';
          const label = freq >= 1000 ? `${freq / 1000}k` : `${freq}Hz`;
          ctx.fillText(label, x, height - 4);
        });
      }

      // Check if we have active audio data
      const isSounding = isPlaying || testToneActive !== null || audioMiniDaw.getIsPlaying();
      let freqData: Uint8Array;
      let timeData: Uint8Array;

      if (isFrozen && frozenDataRef.current) {
        freqData = frozenDataRef.current.freqData;
        timeData = frozenDataRef.current.timeData;
      } else if (activeAnalyser && (isSounding || true)) {
        const binCount = activeAnalyser.frequencyBinCount;
        freqData = new Uint8Array(binCount);
        timeData = new Uint8Array(binCount);
        activeAnalyser.getByteFrequencyData(freqData);
        activeAnalyser.getByteTimeDomainData(timeData);
        frozenDataRef.current = { freqData, timeData };
      } else {
        // Standby idle data (very quiet noise floor at -90dB)
        const binCount = activeAnalyser ? activeAnalyser.frequencyBinCount : 512;
        freqData = new Uint8Array(binCount);
        timeData = new Uint8Array(binCount);
        timeData.fill(128);
      }

      // Compute Peak Frequency & RMS
      const audioCtx = audioMiniDaw.getAudioContext();
      const sampleRate = audioCtx ? audioCtx.sampleRate : 48000;
      const binCount = freqData.length;
      const binHz = (sampleRate / 2) / binCount;

      localPeakVal = 0;
      localPeakFreq = 0;
      localRmsSum = 0;

      for (let i = 0; i < binCount; i++) {
        const val = freqData[i];
        if (val > localPeakVal) {
          localPeakVal = val;
          localPeakFreq = i * binHz;
        }
        localRmsSum += (val / 255) * (val / 255);
      }

      const calculatedRms = Math.sqrt(localRmsSum / binCount);
      const calculatedDb = -90 + (localPeakVal / 255) * 90;
      const calculatedRmsDb = -90 + calculatedRms * 90;

      // Update state sparingly (every ~6 frames)
      if (Math.random() < 0.18) {
        setPeakFrequency(Math.round(localPeakFreq));
        setPeakDb(Math.round(calculatedDb * 10) / 10);
        setRmsLevel(Math.round(calculatedRmsDb * 10) / 10);
      }

      // Logarithmic RTA Bands setup (64 or 96 logarithmically spaced frequency bars)
      const numBands = 72;
      const bandWidth = (width - 12) / numBands;
      const minLog = Math.log10(20);
      const maxLog = Math.log10(20000);
      const bandAmps = new Float32Array(numBands);

      for (let b = 0; b < numBands; b++) {
        const fStart = Math.pow(10, minLog + (b / numBands) * (maxLog - minLog));
        const fEnd = Math.pow(10, minLog + ((b + 1) / numBands) * (maxLog - minLog));

        const startBin = Math.max(0, Math.floor(fStart / binHz));
        const endBin = Math.min(binCount - 1, Math.ceil(fEnd / binHz));

        let maxVal = 0;
        let sumVal = 0;
        let count = 0;

        for (let bin = startBin; bin <= endBin; bin++) {
          const v = freqData[bin] || 0;
          if (v > maxVal) maxVal = v;
          sumVal += v;
          count++;
        }

        // Weighted blend of peak & average in octave band
        const avg = count > 0 ? sumVal / count : 0;
        const norm = (maxVal * 0.7 + avg * 0.3) / 255;
        bandAmps[b] = norm;

        // Peak Hold logic with gravity decay
        if (showPeakCaps) {
          if (norm >= peaksRef.current[b]) {
            peaksRef.current[b] = norm;
            peakHoldCountersRef.current[b] = 24; // hold for 24 frames (~400ms)
          } else {
            if (peakHoldCountersRef.current[b] > 0) {
              peakHoldCountersRef.current[b]--;
            } else {
              peaksRef.current[b] = Math.max(0, peaksRef.current[b] - 0.016);
            }
          }
        }
      }

      // MODE 1: LOGARITHMIC RTA BARS
      if (mode === 'bars') {
        const barMargin = Math.max(1, bandWidth * 0.2);
        const actualBarW = Math.max(1.5, bandWidth - barMargin);

        for (let b = 0; b < numBands; b++) {
          const x = 6 + b * bandWidth;
          const amp = bandAmps[b];
          const barH = amp * (height - 36);
          const y = height - 18 - barH;

          if (barH > 0.5) {
            ctx.fillStyle = themeColors.gradient;
            ctx.beginPath();
            // Rounded top corners on bars
            const radius = Math.min(2, actualBarW / 2);
            ctx.roundRect(x, y, actualBarW, barH, [radius, radius, 0, 0]);
            ctx.fill();
          }

          // Peak cap indicator line
          if (showPeakCaps && peaksRef.current[b] > 0.02) {
            const peakH = peaksRef.current[b] * (height - 36);
            const peakY = height - 18 - peakH;

            ctx.fillStyle = themeColors.peakColor;
            ctx.shadowColor = themeColors.peakColor;
            ctx.shadowBlur = 4;
            ctx.fillRect(x, peakY - 1.5, actualBarW, 2);
            ctx.shadowBlur = 0;
          }
        }
      }

      // MODE 2: SMOOTH SPLINE & TRANSLUCENT AREA FILL
      else if (mode === 'curve') {
        ctx.beginPath();
        const startX = 6;
        const startY = height - 18;
        ctx.moveTo(startX, startY);

        const points: { x: number; y: number }[] = [];
        for (let b = 0; b < numBands; b++) {
          const x = 6 + b * bandWidth + bandWidth / 2;
          const amp = bandAmps[b];
          const y = height - 18 - amp * (height - 36);
          points.push({ x, y });
        }

        // Catmull-Rom or Bezier spline through points
        if (points.length > 0) {
          ctx.lineTo(points[0].x, points[0].y);
          for (let i = 0; i < points.length - 1; i++) {
            const p0 = points[i];
            const p1 = points[i + 1];
            const midX = (p0.x + p1.x) / 2;
            ctx.quadraticCurveTo(p0.x, p0.y, midX, (p0.y + p1.y) / 2);
          }
          const last = points[points.length - 1];
          ctx.lineTo(last.x, last.y);
          ctx.lineTo(width - 6, startY);
          ctx.closePath();

          // Area Fill
          const fillGrad = ctx.createLinearGradient(0, 0, 0, height);
          fillGrad.addColorStop(0, themeColors.glowColor);
          fillGrad.addColorStop(1, 'rgba(6, 182, 212, 0.02)');
          ctx.fillStyle = fillGrad;
          ctx.fill();

          // Spline Stroke
          ctx.beginPath();
          ctx.moveTo(points[0].x, points[0].y);
          for (let i = 0; i < points.length - 1; i++) {
            const p0 = points[i];
            const p1 = points[i + 1];
            const midX = (p0.x + p1.x) / 2;
            ctx.quadraticCurveTo(p0.x, p0.y, midX, (p0.y + p1.y) / 2);
          }
          ctx.strokeStyle = themeColors.lineColor;
          ctx.lineWidth = 2.2;
          ctx.shadowColor = themeColors.lineColor;
          ctx.shadowBlur = 8;
          ctx.stroke();
          ctx.shadowBlur = 0;
        }

        // Peak Envelope curve line
        if (showPeakCaps) {
          ctx.beginPath();
          for (let b = 0; b < numBands; b++) {
            const x = 6 + b * bandWidth + bandWidth / 2;
            const peakH = peaksRef.current[b] * (height - 36);
            const peakY = height - 18 - peakH;
            if (b === 0) ctx.moveTo(x, peakY);
            else ctx.lineTo(x, peakY);
          }
          ctx.strokeStyle = themeColors.peakColor;
          ctx.lineWidth = 1;
          ctx.setLineDash([2, 3]);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      // MODE 3: SPECTROGRAM WATERFALL
      else if (mode === 'waterfall') {
        if (!offscreenCanvasRef.current) {
          offscreenCanvasRef.current = document.createElement('canvas');
        }
        const offCanvas = offscreenCanvasRef.current;
        if (offCanvas.width !== width || offCanvas.height !== height) {
          offCanvas.width = width;
          offCanvas.height = height;
        }
        const offCtx = offCanvas.getContext('2d');

        if (offCtx && isSounding) {
          // Shift existing image down by 2 pixels
          offCtx.drawImage(offCanvas, 0, 0, width, height - 20, 0, 2, width, height - 20);

          // Draw new top line based on band amplitudes
          const sliceH = 2;
          for (let b = 0; b < numBands; b++) {
            const x = 6 + b * bandWidth;
            const val = bandAmps[b]; // 0..1

            // Color map for spectrogram heat: 0 is dark blue, 0.4 cyan, 0.7 yellow, 1.0 white/red
            let r = 0, g = 0, bl = 0;
            if (val < 0.25) {
              bl = Math.floor(val * 4 * 200);
            } else if (val < 0.5) {
              const f = (val - 0.25) * 4;
              g = Math.floor(f * 180);
              bl = 220;
            } else if (val < 0.75) {
              const f = (val - 0.5) * 4;
              r = Math.floor(f * 240);
              g = 220;
              bl = Math.floor((1 - f) * 150);
            } else {
              const f = (val - 0.75) * 4;
              r = 255;
              g = Math.floor(220 + f * 35);
              bl = Math.floor(f * 255);
            }

            offCtx.fillStyle = `rgb(${r},${g},${bl})`;
            offCtx.fillRect(x, 18, bandWidth, sliceH);
          }

          // Composite offscreen canvas to main canvas
          ctx.drawImage(offCanvas, 0, 0);
        } else {
          ctx.drawImage(offCanvas, 0, 0);
        }
      }

      // MODE 4: HYBRID RTA BARS + OSCILLOSCOPE WAVEFORM
      else if (mode === 'hybrid') {
        // 1. Semi-transparent background bars
        const barMargin = Math.max(1, bandWidth * 0.25);
        const actualBarW = Math.max(1.5, bandWidth - barMargin);

        ctx.globalAlpha = 0.45;
        for (let b = 0; b < numBands; b++) {
          const x = 6 + b * bandWidth;
          const amp = bandAmps[b];
          const barH = amp * (height - 36);
          const y = height - 18 - barH;

          if (barH > 0.5) {
            ctx.fillStyle = themeColors.gradient;
            ctx.fillRect(x, y, actualBarW, barH);
          }
        }
        ctx.globalAlpha = 1.0;

        // 2. Foreground Zero-Crossing Oscilloscope Waveform
        const timeLen = timeData.length;
        // Zero-crossing alignment
        let startIdx = 0;
        for (let i = 0; i < Math.min(timeLen / 2, 200); i++) {
          if (timeData[i] < 128 && timeData[i + 1] >= 128) {
            startIdx = i;
            break;
          }
        }

        ctx.beginPath();
        const sliceW = width / (timeLen - startIdx);
        for (let i = startIdx; i < timeLen; i++) {
          const v = timeData[i] / 128.0; // 0..2
          const y = ((v - 1) * 0.75 + 1) * (height / 2);
          const x = (i - startIdx) * sliceW;
          if (i === startIdx) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }

        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2.0;
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 6;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Idle Waveform Line when paused
      if (!isSounding) {
        ctx.strokeStyle = 'rgba(71, 85, 105, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, height - 18);
        ctx.lineTo(width, height - 18);
        ctx.stroke();

        ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('• AUDIO ENGINE STANDBY • PLAY STEMS OR TEST TONE FOR REAL-TIME RTA •', width / 2, height / 2);
      }

      // 5. Interactive Cursor Crosshair & Tooltip Overlay
      if (hoverInfo && hoverInfo.active) {
        const { x, y, freq, db, note, bandName } = hoverInfo;

        // Vertical cursor guide line
        ctx.strokeStyle = 'rgba(244, 63, 94, 0.6)';
        ctx.setLineDash([2, 2]);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, 16);
        ctx.lineTo(x, height - 18);
        ctx.stroke();

        // Horizontal cursor guide line
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Interactive HUD Tooltip Box
        const pillText = `${freq >= 1000 ? (freq / 1000).toFixed(2) + ' kHz' : freq + ' Hz'} • ${note} • ${db > 0 ? '+' : ''}${db} dBFS`;
        ctx.font = 'bold 9px monospace';
        const textMetrics = ctx.measureText(pillText);
        const pillW = textMetrics.width + 16;
        const pillH = 20;

        let pillX = x + 12;
        if (pillX + pillW > width - 10) pillX = x - pillW - 12;
        let pillY = y - 10;
        if (pillY < 20) pillY = y + 15;
        if (pillY + pillH > height - 20) pillY = height - 28;

        // Tooltip background
        ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
        ctx.strokeStyle = 'rgba(244, 63, 94, 0.8)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(pillX, pillY, pillW, pillH, 4);
        ctx.fill();
        ctx.stroke();

        // Tooltip text
        ctx.fillStyle = '#fecdd3';
        ctx.textAlign = 'left';
        ctx.fillText(pillText, pillX + 8, pillY + 13);
      }

      ctx.restore();
      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [
    analyser,
    isPlaying,
    mode,
    theme,
    isFrozen,
    isDarkMode,
    showPeakCaps,
    showGrid,
    hoverInfo,
    testToneActive,
    ampToY,
    freqToX,
    getThemeColors
  ]);

  const peakNoteInfo = useMemo(() => {
    return frequencyToNote(peakFrequency);
  }, [peakFrequency]);

  return (
    <div
      ref={containerRef}
      className={`rounded-2xl border transition-all duration-200 overflow-hidden shadow-2xl ${
        isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-900 border-slate-700'
      }`}
    >
      {/* Top Visualizer Control Bar */}
      <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3">
        {/* Title & Status */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="text-xs font-black tracking-wide text-white uppercase font-mono">
              Live Frequency Spectrum (RTA)
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] font-mono">
            <span
              className={`w-2 h-2 rounded-full ${
                isPlaying || testToneActive
                  ? 'bg-emerald-400 shadow-[0_0_8px_#10b981] animate-ping'
                  : 'bg-slate-600'
              }`}
            />
            <span className={isPlaying || testToneActive ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
              {isPlaying
                ? '4-STEM MASTER SUM'
                : testToneActive
                ? `TEST TONE: ${testToneActive.toUpperCase()}`
                : 'ENGINE IDLE'}
            </span>
          </div>

          {/* Real-time Peak & Note Readout Badge */}
          {peakFrequency > 20 && (
            <div className="flex items-center gap-2 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-[10px] font-mono">
              <span className="text-slate-400">PEAK:</span>
              <span className="font-bold text-cyan-300">
                {peakFrequency >= 1000 ? `${(peakFrequency / 1000).toFixed(2)} kHz` : `${peakFrequency} Hz`}
              </span>
              <span className="text-amber-400 font-bold">
                ({peakNoteInfo.note}
                {peakNoteInfo.octave} {peakNoteInfo.cents >= 0 ? `+${peakNoteInfo.cents}c` : `${peakNoteInfo.cents}c`})
              </span>
              <span className="text-slate-500">|</span>
              <span className="text-emerald-400 font-bold">{peakDb.toFixed(1)} dBFS</span>
              <span className="text-slate-500">|</span>
              <span className="text-indigo-300">RMS: {rmsLevel.toFixed(1)} dB</span>
            </div>
          )}
        </div>

        {/* Action Controls & Mode Selector */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {/* Visualizer Modes */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px] font-mono">
            <button
              onClick={() => setMode('bars')}
              className={`px-2 py-1 rounded transition flex items-center gap-1 ${
                mode === 'bars' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Logarithmic RTA 64-Band Octave Bars"
            >
              <BarChart2 className="w-3 h-3" />
              <span>RTA Bars</span>
            </button>
            <button
              onClick={() => setMode('curve')}
              className={`px-2 py-1 rounded transition flex items-center gap-1 ${
                mode === 'curve' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Smooth FFT Spline Curve & Filled Area"
            >
              <TrendingUp className="w-3 h-3" />
              <span>Spline</span>
            </button>
            <button
              onClick={() => setMode('waterfall')}
              className={`px-2 py-1 rounded transition flex items-center gap-1 ${
                mode === 'waterfall' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Spectrogram 2D Heatmap Waterfall"
            >
              <Waves className="w-3 h-3" />
              <span>Spectrogram</span>
            </button>
            <button
              onClick={() => setMode('hybrid')}
              className={`px-2 py-1 rounded transition flex items-center gap-1 ${
                mode === 'hybrid' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Hybrid: Spectrum Bars + Oscilloscope Waveform"
            >
              <Radio className="w-3 h-3" />
              <span>Hybrid Scope</span>
            </button>
          </div>

          {/* Color Themes */}
          <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 text-[10px] font-mono text-slate-400">
            <span>THEME:</span>
            {(['cyber', 'amber', 'phosphor', 'ice'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`px-1.5 py-0.5 rounded capitalize transition ${
                  theme === t ? 'bg-slate-800 text-white font-bold border border-slate-700' : 'hover:text-slate-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Freeze Frame Button */}
          <button
            onClick={() => setIsFrozen(!isFrozen)}
            className={`px-2 py-1 rounded-lg border text-[11px] font-mono flex items-center gap-1 transition ${
              isFrozen
                ? 'bg-amber-500/20 border-amber-500/80 text-amber-300 font-bold'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
            }`}
            title="Freeze / Hold current FFT frame for static inspection"
          >
            {isFrozen ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
            <span>{isFrozen ? 'Unfreeze' : 'Freeze'}</span>
          </button>

          {/* Peak Hold Caps Toggle */}
          <button
            onClick={() => setShowPeakCaps(!showPeakCaps)}
            className={`px-2 py-1 rounded-lg border text-[11px] font-mono transition ${
              showPeakCaps
                ? 'bg-slate-800 border-slate-700 text-cyan-300'
                : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
            title="Toggle Falling Peak Hold Caps"
          >
            Peaks
          </button>

          {/* Expand / Minimize Height */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition"
            title={isExpanded ? 'Compact Visualizer' : 'Expand Visualizer View'}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Interactive Canvas Area */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className={`w-full block cursor-crosshair transition-all duration-300 ${
            isExpanded ? 'h-64 sm:h-72' : 'h-36 sm:h-44'
          }`}
        />

        {/* Audio Engine Spec Badge Overlay */}
        <div className="absolute top-2 left-3 pointer-events-none flex items-center gap-2 text-[9px] font-mono text-slate-400 bg-slate-950/70 backdrop-blur-xs px-2 py-1 rounded border border-slate-800/80">
          <span className="text-indigo-400 font-bold">FFT 1024</span>
          <span>•</span>
          <span>SR: 48,000 Hz</span>
          <span>•</span>
          <span>LOG 20Hz - 20kHz</span>
          <span>•</span>
          <span>ISO 1/3-OCT</span>
        </div>

        {/* Top-Right Signal Generator Quick-Bar */}
        <div className="absolute top-2 right-3 flex items-center gap-1.5 bg-slate-950/80 backdrop-blur-xs px-2 py-1 rounded-lg border border-slate-800/80 text-[10px] font-mono">
          <span className="text-slate-400 flex items-center gap-1">
            <Volume2 className="w-3 h-3 text-cyan-400" />
            <span>TEST TONE:</span>
          </span>
          {(['1k', '440', 'pink', 'sweep'] as const).map((sig) => (
            <button
              key={sig}
              onClick={() => handleToggleTestTone(sig)}
              className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition uppercase ${
                testToneActive === sig
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {sig === '1k' ? '1 kHz' : sig === '440' ? '440 Hz' : sig === 'pink' ? 'Pink' : 'Sweep'}
            </button>
          ))}
          {testToneActive && (
            <button
              onClick={() => handleToggleTestTone(testToneActive as any)}
              className="text-rose-400 hover:text-rose-300 ml-1 font-bold text-xs"
              title="Stop Signal Generator"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Bottom Audio Engineering Guidance Strip */}
      <div className="px-4 py-2 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between flex-wrap gap-2 text-[10px] font-mono text-slate-400">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="font-bold text-slate-300 flex items-center gap-1">
            <Compass className="w-3 h-3 text-indigo-400" />
            <span>SOP Mixing Bands:</span>
          </span>
          {FREQ_BANDS.map((b) => (
            <span key={b.name} className="flex items-center gap-1">
              <span className={`font-bold ${b.color}`}>{b.name}</span>
              <span className="text-slate-500">
                ({b.min < 1000 ? `${b.min}` : `${b.min / 1000}k`}-{b.max < 1000 ? `${b.max}Hz` : `${b.max / 1000}k`})
              </span>
            </span>
          ))}
        </div>

        {/* Smoothing Selector & Reset Peaks */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">RESPONSE:</span>
            {[
              { label: 'Fast', val: 0.55 },
              { label: 'Med', val: 0.82 },
              { label: 'Smooth', val: 0.92 }
            ].map((s) => (
              <button
                key={s.label}
                onClick={() => setSmoothing(s.val)}
                className={`px-1.5 py-0.5 rounded text-[9px] transition ${
                  smoothing === s.val ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleResetPeaks}
            className="hover:text-cyan-400 flex items-center gap-1 transition"
            title="Reset All Peak Hold Indicators"
          >
            <RotateCcw className="w-2.5 h-2.5" />
            <span>Clear Peaks</span>
          </button>
        </div>
      </div>
    </div>
  );
};
