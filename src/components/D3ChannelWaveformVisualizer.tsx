import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Activity, Radio, Sparkles, Volume2, Maximize2, Minimize2 } from 'lucide-react';
import { MixerTrack } from '../types';
import { audioMiniDaw } from '../utils/audioEngine';

interface D3ChannelWaveformVisualizerProps {
  track: MixerTrack;
  isPlaying: boolean;
  playbackProgressPercent?: number;
  height?: number;
  isDarkMode?: boolean;
  onSeekPercent?: (percent: number) => void;
}

// Characteristic UVR5 Stem Acoustic Profiles
interface UvrStemProfile {
  label: string;
  model: string;
  passband: string;
  color: string;
  transientSharpness: number; // 0 to 1
  density: number;            // 0 to 1
  sustain: number;            // 0 to 1
  frequencyCenterHz: number;
}

const getUvrStemProfile = (track: MixerTrack): UvrStemProfile => {
  const stemType = (track.stemType || '').toLowerCase();
  const name = (track.name || '').toLowerCase();

  if (stemType === 'vocal' || name.includes('vocal') || name.includes('lead') || track.id === 1) {
    return {
      label: 'Clean Lead Vocal',
      model: track.modelUsed || 'BS-Roformer-Viperx-1297',
      passband: '250Hz – 4.5kHz Passband',
      color: track.color || '#8B5CF6',
      transientSharpness: 0.65,
      density: 0.58,
      sustain: 0.72,
      frequencyCenterHz: 1250
    };
  }

  if (stemType === 'drums' || name.includes('drum') || name.includes('rhythm') || name.includes('perc') || track.id === 2) {
    return {
      label: 'Rhythm Transients',
      model: track.modelUsed || 'Rhythm Transient Decoupler',
      passband: '50Hz – 12kHz Attack Envelope',
      color: track.color || '#06B6D4',
      transientSharpness: 0.95,
      density: 0.42,
      sustain: 0.35,
      frequencyCenterHz: 3500
    };
  }

  if (stemType === 'bass' || name.includes('bass') || name.includes('sub') || track.id === 3) {
    return {
      label: 'Sub-Bass & Harmonics',
      model: track.modelUsed || 'Sub-Bass Harmonic Filter',
      passband: '20Hz – 180Hz Low-Shelf',
      color: track.color || '#F59E0B',
      transientSharpness: 0.35,
      density: 0.88,
      sustain: 0.92,
      frequencyCenterHz: 65
    };
  }

  return {
    label: 'Melodic Bed & Harmonics',
    model: track.modelUsed || 'MelBand-Roformer-Kim-Inst-V2',
    passband: 'Stereo Harmonic Bed (Residue FFT)',
    color: track.color || '#10B981',
    transientSharpness: 0.55,
    density: 0.75,
    sustain: 0.82,
    frequencyCenterHz: 880
  };
};

export const D3ChannelWaveformVisualizer: React.FC<D3ChannelWaveformVisualizerProps> = ({
  track,
  isPlaying,
  playbackProgressPercent = 0,
  height = 84,
  isDarkMode = true,
  onSeekPercent
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 400, height });
  const [viewMode, setViewMode] = useState<'waveform' | 'spectrum'>('waveform');
  const [hoverPosition, setHoverPosition] = useState<{ x: number; percent: number } | null>(null);
  const [liveMetrics, setLiveMetrics] = useState<{ peakDb: number; rmsDb: number }>({ peakDb: -90, rmsDb: -90 });

  const profile = useMemo(() => getUvrStemProfile(track), [track]);

  // Handle responsive width resizing
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        if (width > 0) {
          setDimensions({ width, height });
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [height]);

  // Deterministic baseline envelope representing UVR5 stem data along the song structure
  const stemEnvelopeData = useMemo(() => {
    const pointsCount = 120;
    const points: number[] = [];
    const seed = track.id * 1000 + (track.name.length || 10);

    for (let i = 0; i < pointsCount; i++) {
      const p = i / pointsCount;
      let envelope = 0.5;

      if (profile.label.includes('Vocal')) {
        // Vocal phrasing: intro silence, dynamic verse lines, chorus peak, bridge breakdown
        if (p < 0.1) envelope = 0.08;
        else if (p < 0.35) envelope = 0.5 + 0.35 * Math.sin((p - 0.1) * 22) * Math.cos(p * 15);
        else if (p < 0.6) envelope = 0.85 + 0.15 * Math.sin(p * 30);
        else if (p < 0.75) envelope = 0.3 + 0.4 * Math.sin((p - 0.6) * 12);
        else envelope = 0.95 + 0.05 * Math.sin(p * 28);
      } else if (profile.label.includes('Rhythm')) {
        // Drum transients: 4-on-the-floor beat spikes with rapid decays
        const beatFraction = (p * 32) % 1;
        const transient = Math.exp(-beatFraction * 8);
        const barEmphasis = (Math.floor(p * 32) % 4 === 0) ? 1.0 : 0.65;
        envelope = Math.min(1.0, 0.15 + transient * barEmphasis * 0.85);
      } else if (profile.label.includes('Bass')) {
        // Sustained sub-bass: solid foundation with rhythmic 2-bar movement
        const bassNote = 0.55 + 0.35 * Math.sin(p * 18);
        const subRumble = 0.1 * Math.sin(p * 85);
        envelope = Math.min(1.0, Math.max(0.2, bassNote + subRumble));
      } else {
        // Melodic bed: layered acoustic arpeggios and stereo pad swells
        envelope = 0.45 + 0.38 * Math.sin(p * 14) * Math.cos(p * 9) + 0.15 * Math.sin(p * 45);
      }

      // Add pseudo-random harmonic texture
      const jitter = Math.abs(Math.sin((seed + i * 17) * 9.8)) * 0.18;
      const finalVal = Math.min(1.0, Math.max(0.06, envelope + jitter * 0.5));
      points.push(finalVal);
    }
    return points;
  }, [track.id, track.name, profile]);

  // Live Audio Render Loop via D3 and Web Audio Analyser
  useEffect(() => {
    const svgElement = svgRef.current;
    if (!svgElement) return;

    const svg = d3.select(svgElement);
    const { width, height: h } = dimensions;
    const midY = h / 2;

    // Buffer for reading live time-domain and frequency data
    const timeDomainBuffer = new Float32Array(128);
    const frequencyBuffer = new Uint8Array(64);

    let animId: number;

    const renderFrame = () => {
      const hasLiveWebAudio = isPlaying && audioMiniDaw.getTrackWaveformData(track.id, timeDomainBuffer);
      audioMiniDaw.getTrackFrequencyData(track.id, frequencyBuffer);

      let dataToRender: number[] = [];
      let peakLinear = 0;
      let sumSq = 0;

      if (hasLiveWebAudio && !track.muted) {
        const step = Math.floor(timeDomainBuffer.length / stemEnvelopeData.length) || 1;
        for (let i = 0; i < stemEnvelopeData.length; i++) {
          const sample = timeDomainBuffer[i * step] || 0;
          const absVal = Math.abs(sample);
          if (absVal > peakLinear) peakLinear = absVal;
          sumSq += sample * sample;

          // Blend live audio data with UVR5 profile envelope
          const liveAmp = Math.min(1.0, absVal * (track.vol / 85) * 2.2);
          const baseline = stemEnvelopeData[i] * 0.25;
          dataToRender.push(Math.max(baseline, liveAmp));
        }
      } else if (isPlaying && !track.muted) {
        // Dynamic simulated live wave if analyser buffer is ramping
        const now = performance.now() * 0.005;
        for (let i = 0; i < stemEnvelopeData.length; i++) {
          const phase = i * 0.2 + now * (profile.transientSharpness * 3 + 1);
          const dynamicWave = Math.sin(phase) * 0.4 + Math.cos(phase * 1.8) * 0.25;
          const base = stemEnvelopeData[i];
          const amp = Math.min(1.0, Math.max(0.05, (base * 0.7 + dynamicWave * 0.3) * (track.vol / 100)));
          if (amp > peakLinear) peakLinear = amp;
          sumSq += amp * amp;
          dataToRender.push(amp);
        }
      } else {
        // Idle/paused/muted: static UVR5 stem envelope reflecting processed stem
        dataToRender = stemEnvelopeData.map(v => v * (track.muted ? 0.08 : (track.vol / 100)));
        peakLinear = track.muted ? 0.02 : 0.65;
        sumSq = peakLinear * peakLinear;
      }

      // Compute RMS and Peak dB for live readouts
      const rmsLinear = Math.sqrt(sumSq / dataToRender.length);
      const peakDb = peakLinear > 1e-4 ? Math.round(20 * Math.log10(peakLinear) * 10) / 10 : -90;
      const rmsDb = rmsLinear > 1e-4 ? Math.round(20 * Math.log10(rmsLinear) * 10) / 10 : -90;
      setLiveMetrics({ peakDb, rmsDb });

      // Build D3 Scales
      const xScale = d3.scaleLinear()
        .domain([0, dataToRender.length - 1])
        .range([0, width]);

      // Mirror upper and lower areas for symmetric DAW audio waveform
      const upperArea = d3.area<number>()
        .x((_, i) => xScale(i))
        .y0(midY)
        .y1((d) => midY - d * (midY - 4))
        .curve(d3.curveMonotoneX);

      const lowerArea = d3.area<number>()
        .x((_, i) => xScale(i))
        .y0(midY)
        .y1((d) => midY + d * (midY - 4) * 0.85) // Subtle asymmetry for analog warmth
        .curve(d3.curveMonotoneX);

      const centerLine = d3.line<number>()
        .x((_, i) => xScale(i))
        .y((d) => midY - d * (midY - 4))
        .curve(d3.curveMonotoneX);

      // Select and update D3 SVG paths
      svg.select<SVGPathElement>('.waveform-upper-area')
        .datum(dataToRender)
        .attr('d', upperArea);

      svg.select<SVGPathElement>('.waveform-lower-area')
        .datum(dataToRender)
        .attr('d', lowerArea);

      svg.select<SVGPathElement>('.waveform-center-line')
        .datum(dataToRender)
        .attr('d', centerLine);

      // Update playhead scrubber
      const playheadX = (playbackProgressPercent / 100) * width;
      svg.select('.playhead-line')
        .attr('x1', playheadX)
        .attr('x2', playheadX);

      svg.select('.playhead-bead')
        .attr('cx', playheadX);

      // Update played region tint
      svg.select('.played-region-rect')
        .attr('width', Math.max(0, playheadX));

      if (isPlaying) {
        animId = requestAnimationFrame(renderFrame);
      }
    };

    renderFrame();

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [dimensions, isPlaying, track.id, track.vol, track.muted, playbackProgressPercent, stemEnvelopeData, profile]);

  // Click & Drag to Seek
  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || !onSeekPercent) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const percent = Math.round((x / rect.width) * 100);
    onSeekPercent(percent);
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const percent = Math.round((x / rect.width) * 100);
    setHoverPosition({ x, percent });
  };

  const handleMouseLeave = () => {
    setHoverPosition(null);
  };

  const gradientId = `uvr-gradient-ch-${track.id}`;
  const playedGradientId = `uvr-played-gradient-ch-${track.id}`;

  return (
    <div
      ref={containerRef}
      className="w-full bg-slate-950 border border-slate-800/90 rounded-xl p-2.5 space-y-2 font-mono select-none relative overflow-hidden transition-all duration-200 hover:border-slate-700 shadow-sm"
      style={{
        boxShadow: isPlaying ? `0 0 16px -6px ${profile.color}40, inset 0 1px 0 0 ${profile.color}30` : undefined
      }}
    >
      {/* Top Metadata & Live Metrics Bar */}
      <div className="flex items-center justify-between flex-wrap gap-2 text-[10px] text-slate-400">
        <div className="flex items-center gap-2">
          {/* Stem Label & Model Badge */}
          <div className="flex items-center gap-1.5 font-bold text-white">
            <span
              className="w-2 h-2 rounded-full shrink-0 shadow-xs"
              style={{ backgroundColor: profile.color }}
            />
            <span className="truncate max-w-[140px] sm:max-w-none">{profile.label}</span>
          </div>

          <span
            className="px-1.5 py-0.2 rounded text-[9px] font-bold border truncate max-w-[150px] sm:max-w-none"
            style={{
              backgroundColor: `${profile.color}15`,
              color: profile.color,
              borderColor: `${profile.color}45`
            }}
            title={`Isolated using ${profile.model}`}
          >
            {profile.model.split('-')[0]}-{profile.model.split('-')[1] || 'UVR5'}
          </span>

          <span className="text-slate-500 hidden md:inline truncate text-[9px]">
            {profile.passband}
          </span>
        </div>

        {/* Live Peak & RMS Meters */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 uppercase">Peak:</span>
            <span
              className={`font-bold tabular-nums ${
                liveMetrics.peakDb > -1.0
                  ? 'text-rose-400'
                  : liveMetrics.peakDb > -6.0
                  ? 'text-amber-300'
                  : 'text-slate-300'
              }`}
            >
              {liveMetrics.peakDb > -80 ? `${liveMetrics.peakDb.toFixed(1)} dB` : '-∞'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 hidden sm:flex">
            <span className="text-slate-500 uppercase">RMS:</span>
            <span className="text-slate-400 tabular-nums">
              {liveMetrics.rmsDb > -80 ? `${liveMetrics.rmsDb.toFixed(1)} dB` : '-∞'}
            </span>
          </div>

          {/* Real-time Indicator Pill */}
          <div className="flex items-center gap-1 px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-[9px]">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isPlaying && !track.muted ? 'animate-pulse' : 'opacity-40'
              }`}
              style={{ backgroundColor: profile.color }}
            />
            <span className="text-slate-400 font-bold">{isPlaying && !track.muted ? 'LIVE D3' : 'READY'}</span>
          </div>
        </div>
      </div>

      {/* Main D3 Interactive Waveform SVG Canvas */}
      <div className="relative w-full overflow-hidden rounded-lg bg-slate-950/90 border border-slate-900 cursor-crosshair">
        <svg
          ref={svgRef}
          width="100%"
          height={dimensions.height}
          onClick={handleSvgClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="w-full block"
        >
          <defs>
            {/* Unplayed Waveform Gradient */}
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={profile.color} stopOpacity="0.85" />
              <stop offset="48%" stopColor={profile.color} stopOpacity="0.45" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="0.9" />
              <stop offset="52%" stopColor={profile.color} stopOpacity="0.45" />
              <stop offset="100%" stopColor={profile.color} stopOpacity="0.85" />
            </linearGradient>

            {/* Played Region Highlight Gradient */}
            <linearGradient id={playedGradientId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3" />
              <stop offset="50%" stopColor={profile.color} stopOpacity="0.6" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.3" />
            </linearGradient>
          </defs>

          {/* Grid lines: Zero center line & 6dB headroom guides */}
          <line
            x1="0"
            y1={dimensions.height / 2}
            x2={dimensions.width}
            y2={dimensions.height / 2}
            stroke="#1e293b"
            strokeWidth="1"
            strokeDasharray="2,4"
          />
          <line
            x1="0"
            y1={dimensions.height * 0.25}
            x2={dimensions.width}
            y2={dimensions.height * 0.25}
            stroke="#0f172a"
            strokeWidth="0.75"
          />
          <line
            x1="0"
            y1={dimensions.height * 0.75}
            x2={dimensions.width}
            y2={dimensions.height * 0.75}
            stroke="#0f172a"
            strokeWidth="0.75"
          />

          {/* Played Region Tint Shading */}
          <rect
            className="played-region-rect"
            x="0"
            y="0"
            width="0"
            height={dimensions.height}
            fill={profile.color}
            opacity="0.10"
          />

          {/* D3 Rendered Upper Half Area */}
          <path
            className="waveform-upper-area"
            fill={`url(#${gradientId})`}
            opacity="0.78"
          />

          {/* D3 Rendered Lower Half Area */}
          <path
            className="waveform-lower-area"
            fill={`url(#${gradientId})`}
            opacity="0.55"
          />

          {/* D3 Crisp Center Peak Line */}
          <path
            className="waveform-center-line"
            fill="none"
            stroke={profile.color}
            strokeWidth="1.25"
            strokeOpacity="0.95"
          />

          {/* Current Playhead Scrubber */}
          <line
            className="playhead-line"
            x1="0"
            y1="0"
            x2="0"
            y2={dimensions.height}
            stroke="#ffffff"
            strokeWidth="1.5"
            strokeOpacity="0.9"
            style={{ filter: `drop-shadow(0 0 4px ${profile.color})` }}
          />
          <circle
            className="playhead-bead"
            cx="0"
            cy={dimensions.height / 2}
            r="3.5"
            fill="#ffffff"
            stroke={profile.color}
            strokeWidth="2"
          />

          {/* Hover Scrubbing Cursor */}
          {hoverPosition && (
            <g pointerEvents="none">
              <line
                x1={hoverPosition.x}
                y1="0"
                x2={hoverPosition.x}
                y2={dimensions.height}
                stroke="#94a3b8"
                strokeWidth="1"
                strokeDasharray="2,2"
                opacity="0.7"
              />
            </g>
          )}
        </svg>

        {/* Hover Scrub Tooltip */}
        {hoverPosition && (
          <div
            className="absolute top-1 pointer-events-none transform -translate-x-1/2 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-[9px] text-white font-mono shadow-md"
            style={{ left: hoverPosition.x }}
          >
            {hoverPosition.percent}% (Seek)
          </div>
        )}
      </div>

      {/* Footer Info & Frequency Distribution */}
      <div className="flex items-center justify-between text-[9px] text-slate-500 pt-0.5">
        <span className="flex items-center gap-1">
          <Activity className="w-2.5 h-2.5 text-slate-400" />
          <span>Center Freq: {profile.frequencyCenterHz} Hz</span>
        </span>

        <span className="font-mono">
          24-Bit Linear PCM • 48kHz Canonical Stream
        </span>

        <span className="text-slate-400 font-bold">
          {track.stemFilename || `${profile.label.replace(/\s+/g, '_')}.wav`}
        </span>
      </div>
    </div>
  );
};
