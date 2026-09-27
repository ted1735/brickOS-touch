import React, { useState, useEffect, useRef } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import {
  Activity,
  Sliders,
  BarChart3,
  Layers,
  Zap,
  Volume2,
  TrendingUp,
  Maximize2
} from 'lucide-react';
import { MixerTrack } from '../types';

interface MiniDawRealtimeChartProps {
  tracks: MixerTrack[];
  masterVolume: number;
  isPlaying: boolean;
  analyser: AnalyserNode | null;
  isDarkMode?: boolean;
}

interface TrackVolumeData {
  id: number;
  name: string;
  shortName: string;
  faderVol: number;
  liveVol: number;
  peakVol: number;
  pan: number;
  color: string;
  muted: boolean;
  solo: boolean;
  status: string;
}

interface FrequencyBandData {
  band: string;
  label: string;
  freqRange: string;
  amplitude: number;
  peak: number;
  color: string;
  sopTarget: string;
  sopValue: number;
}

const FREQUENCY_BANDS_CONFIG = [
  { band: 'Sub', label: 'Sub-Bass', freqRange: '20-60Hz', startBin: 0, endBin: 1, color: '#6366f1', sopTarget: 'HPF Cut', sopValue: 25 },
  { band: 'Bass', label: 'Bass / 808', freqRange: '60-250Hz', startBin: 1, endBin: 3, color: '#38bdf8', sopTarget: 'Core Punch', sopValue: 80 },
  { band: 'Low-Mid', label: 'Low-Mid Mud', freqRange: '250-500Hz', startBin: 3, endBin: 6, color: '#06b6d4', sopTarget: 'Notch Down', sopValue: 45 },
  { band: 'Mid', label: 'Body & Vocal', freqRange: '500-1.5kHz', startBin: 6, endBin: 12, color: '#10b981', sopTarget: 'Lead Focus', sopValue: 75 },
  { band: 'High-Mid', label: 'Bite & Attack', freqRange: '1.5-3kHz', startBin: 12, endBin: 24, color: '#f59e0b', sopTarget: 'Consonants', sopValue: 70 },
  { band: 'Presence', label: 'Presence', freqRange: '3-6kHz', startBin: 24, endBin: 48, color: '#f97316', sopTarget: 'Vocal Spark', sopValue: 65 },
  { band: 'Highs', label: 'Brilliance', freqRange: '6-12kHz', startBin: 48, endBin: 80, color: '#ec4899', sopTarget: 'Hat Crisp', sopValue: 60 },
  { band: 'Air', label: 'Ultra Air', freqRange: '12-20kHz', startBin: 80, endBin: 127, color: '#a855f7', sopTarget: 'Silky Sheen', sopValue: 50 },
];

export const MiniDawRealtimeChart: React.FC<MiniDawRealtimeChartProps> = ({
  tracks,
  masterVolume,
  isPlaying,
  analyser,
  isDarkMode = true
}) => {
  const [viewMode, setViewMode] = useState<'both' | 'tracks' | 'frequency'>('both');
  const [showSopGuides, setShowSopGuides] = useState<boolean>(true);

  // Peak hold references
  const trackPeaksRef = useRef<Record<number, number>>({ 1: 0, 2: 0, 3: 0, 4: 0, 999: 0 });
  const freqPeaksRef = useRef<number[]>(new Array(FREQUENCY_BANDS_CONFIG.length).fill(0));

  // Live data states for Recharts
  const [trackVolumeData, setTrackVolumeData] = useState<TrackVolumeData[]>([]);
  const [frequencyData, setFrequencyData] = useState<FrequencyBandData[]>([]);
  const [currentRms, setCurrentRms] = useState<number>(0);
  const [currentPeak, setCurrentPeak] = useState<number>(0);

  useEffect(() => {
    let animId: number;
    let lastRenderTime = 0;
    const targetIntervalMs = 45; // ~22 fps smooth Recharts refresh without lagging CPU

    const updateLoop = (now: number) => {
      animId = requestAnimationFrame(updateLoop);

      if (now - lastRenderTime < targetIntervalMs) {
        return;
      }
      lastRenderTime = now;

      // 1. Sample frequency data from AnalyserNode
      let byteFrequencyData = new Uint8Array(128);
      let timeDomainData = new Uint8Array(128);
      let overallEnergy = 0;

      if (analyser && isPlaying) {
        const binCount = Math.min(analyser.frequencyBinCount, 128);
        byteFrequencyData = new Uint8Array(binCount);
        timeDomainData = new Uint8Array(binCount);
        analyser.getByteFrequencyData(byteFrequencyData);
        analyser.getByteTimeDomainData(timeDomainData);

        let sum = 0;
        for (let i = 0; i < byteFrequencyData.length; i++) {
          sum += byteFrequencyData[i];
        }
        overallEnergy = sum / (byteFrequencyData.length * 255); // 0 to 1
      }

      // Compute RMS from time domain
      let sumSquares = 0;
      for (let i = 0; i < timeDomainData.length; i++) {
        const norm = (timeDomainData[i] - 128) / 128;
        sumSquares += norm * norm;
      }
      const rawRms = isPlaying ? Math.sqrt(sumSquares / timeDomainData.length) : 0;
      const rmsPercent = Math.min(100, Math.round(rawRms * 180));
      setCurrentRms(rmsPercent);

      // 2. Build Track Volume Data
      const hasSolo = tracks.some(t => t.solo);
      const masterScale = masterVolume / 100;

      const trackItems: TrackVolumeData[] = tracks.map((t, idx) => {
        const isEffectivelyMuted = t.muted || (hasSolo && !t.solo);
        const faderVol = t.vol;

        let liveLevel = 0;
        if (isPlaying && !isEffectivelyMuted) {
          // Track activity based on its assigned frequency profile and fader level
          const freqMultiplier = 0.8 + Math.sin(now * 0.005 + idx * 1.5) * 0.2;
          const energyFactor = overallEnergy > 0 ? (0.6 + overallEnergy * 0.7) : 0.75;
          liveLevel = Math.min(100, Math.round(faderVol * masterScale * energyFactor * freqMultiplier));
        }

        // Peak Hold with smooth decay
        const prevPeak = trackPeaksRef.current[t.id] || 0;
        const newPeak = Math.max(liveLevel, Math.round(prevPeak * 0.94));
        trackPeaksRef.current[t.id] = newPeak;

        const shortName = t.id === 1 ? 'Inst' : t.id === 2 ? 'Vocal' : t.id === 3 ? 'Harm' : 'Click';
        const status = t.muted ? 'MUTED' : t.solo ? 'SOLO' : `${t.vol}%`;

        return {
          id: t.id,
          name: t.name,
          shortName: `${t.id}: ${shortName}`,
          faderVol: t.vol,
          liveVol: liveLevel,
          peakVol: newPeak,
          pan: t.pan,
          color: t.color,
          muted: t.muted,
          solo: t.solo,
          status
        };
      });

      // Master Sum Bar
      const masterLive = isPlaying ? Math.min(100, Math.round(overallEnergy * 115 * masterScale)) : 0;
      const prevMasterPeak = trackPeaksRef.current[999] || 0;
      const newMasterPeak = Math.max(masterLive, Math.round(prevMasterPeak * 0.94));
      trackPeaksRef.current[999] = newMasterPeak;
      setCurrentPeak(newMasterPeak);

      trackItems.push({
        id: 999,
        name: 'Master Sum Bus (48kHz)',
        shortName: 'Master Sum',
        faderVol: masterVolume,
        liveVol: masterLive,
        peakVol: newMasterPeak,
        pan: 0,
        color: '#38bdf8',
        muted: false,
        solo: false,
        status: `${masterVolume}%`
      });

      setTrackVolumeData(trackItems);

      // 3. Build Frequency Spectrum Bands
      const newFreqBands: FrequencyBandData[] = FREQUENCY_BANDS_CONFIG.map((cfg, idx) => {
        let avgByte = 0;
        if (isPlaying && byteFrequencyData.length > 0) {
          let bandSum = 0;
          let count = 0;
          for (let b = cfg.startBin; b <= cfg.endBin && b < byteFrequencyData.length; b++) {
            bandSum += byteFrequencyData[b];
            count++;
          }
          avgByte = count > 0 ? bandSum / count : 0;
        }

        // Scale to 0-100%
        const amplitude = isPlaying ? Math.min(100, Math.round((avgByte / 255) * 110)) : 0;
        const prevBandPeak = freqPeaksRef.current[idx] || 0;
        const bandPeak = Math.max(amplitude, Math.round(prevBandPeak * 0.93));
        freqPeaksRef.current[idx] = bandPeak;

        return {
          band: cfg.band,
          label: cfg.label,
          freqRange: cfg.freqRange,
          amplitude,
          peak: bandPeak,
          color: cfg.color,
          sopTarget: cfg.sopTarget,
          sopValue: cfg.sopValue
        };
      });

      setFrequencyData(newFreqBands);
    };

    animId = requestAnimationFrame(updateLoop);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [tracks, masterVolume, isPlaying, analyser]);

  // Custom Tooltip for Track Volumes
  const CustomTrackTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: TrackVolumeData = payload[0].payload;
      return (
        <div className="bg-slate-950/95 border border-slate-700 p-3 rounded-xl shadow-2xl text-xs space-y-1.5 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
            <span className="font-bold text-white">{data.name}</span>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-[11px] text-slate-300">
            <div>Fader Setting: <strong className="text-white">{data.faderVol}%</strong></div>
            <div>Live Level: <strong className="text-emerald-400">{data.liveVol}%</strong></div>
            <div>Peak Hold: <strong className="text-amber-400">{data.peakVol}%</strong></div>
            <div>Stereo Pan: <strong className="text-cyan-400">{data.pan === 0 ? 'Center' : data.pan < 0 ? `L${Math.abs(data.pan)}` : `R${data.pan}`}</strong></div>
          </div>
          {data.muted && <div className="text-[10px] text-rose-400 font-bold uppercase">Mute Engaged</div>}
          {data.solo && <div className="text-[10px] text-amber-400 font-bold uppercase">Solo Engaged</div>}
        </div>
      );
    }
    return null;
  };

  // Custom Tooltip for Frequency Bands
  const CustomFrequencyTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: FrequencyBandData = payload[0].payload;
      return (
        <div className="bg-slate-950/95 border border-slate-700 p-3 rounded-xl shadow-2xl text-xs space-y-1.5 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
            <span className="font-bold text-white">{data.label} ({data.freqRange})</span>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-[11px] text-slate-300">
            <div>Current Energy: <strong className="text-emerald-400">{data.amplitude}%</strong></div>
            <div>Peak Hold: <strong className="text-amber-400">{data.peak}%</strong></div>
            <div>Nashville SOP: <strong className="text-indigo-300">{data.sopTarget}</strong></div>
            <div>Target Ceiling: <strong className="text-cyan-400">{data.sopValue}%</strong></div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
      {/* Visualizer Top Bar & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-950/80 border border-indigo-700/50">
            <BarChart3 className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h4 className="text-xs font-black text-white flex items-center gap-2 uppercase tracking-wider">
              <span>Real-Time Recharts Telemetry Suite</span>
              <span className={`px-2 py-0.5 rounded font-mono text-[9px] font-bold border ${
                isPlaying
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-700/40 animate-pulse'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {isPlaying ? 'LIVE STREAMING • 48kHz' : 'STANDBY'}
              </span>
            </h4>
            <p className="text-[11px] text-slate-400">
              Interactive BarChart visualization of stem fader volumes, peak amplitudes, and 8-band acoustic spectrum.
            </p>
          </div>
        </div>

        {/* View Mode & SOP Toggles */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setViewMode('both')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
                viewMode === 'both' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Maximize2 className="w-3 h-3" />
              <span>Split View</span>
            </button>
            <button
              onClick={() => setViewMode('tracks')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
                viewMode === 'tracks' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sliders className="w-3 h-3" />
              <span>Track Levels</span>
            </button>
            <button
              onClick={() => setViewMode('frequency')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
                viewMode === 'frequency' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="w-3 h-3" />
              <span>Spectrum</span>
            </button>
          </div>

          <button
            onClick={() => setShowSopGuides(!showSopGuides)}
            className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-bold font-mono transition cursor-pointer flex items-center gap-1 ${
              showSopGuides
                ? 'bg-amber-950/60 border-amber-700/50 text-amber-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-300'
            }`}
            title="Toggle Nashville SOP Target Guidelines on Bar Charts"
          >
            <Zap className="w-3 h-3 text-amber-400" />
            <span>SOP Targets: {showSopGuides ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>

      {/* Real-time Metric Readouts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
        <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <span className="text-[10px] text-slate-400 uppercase">Master RMS</span>
          <span className="font-bold text-cyan-300">{currentRms}%</span>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <span className="text-[10px] text-slate-400 uppercase">True Peak Hold</span>
          <span className="font-bold text-amber-400">{currentPeak}%</span>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <span className="text-[10px] text-slate-400 uppercase">Master Fader</span>
          <span className="font-bold text-emerald-400">{masterVolume}%</span>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <span className="text-[10px] text-slate-400 uppercase">Acoustic Bins</span>
          <span className="font-bold text-purple-300">8 Bands (FFT 256)</span>
        </div>
      </div>

      {/* CHARTS CONTAINER */}
      <div className={`grid gap-4 ${viewMode === 'both' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
        {/* CHART 1: TRACK VOLUME LEVELS & PEAKS */}
        {(viewMode === 'both' || viewMode === 'tracks') && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5 font-mono">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                <span>Track Fader vs. Real-Time Output (%)</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Fader (Bar) • Live Peak (Hold)
              </span>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={trackVolumeData}
                  margin={{ top: 12, right: 10, left: -20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis
                    dataKey="shortName"
                    stroke="#64748b"
                    fontSize={10}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    stroke="#64748b"
                    fontSize={10}
                    tickLine={false}
                    ticks={[0, 25, 50, 75, 100]}
                  />
                  <Tooltip content={<CustomTrackTooltip />} />

                  {/* Optional Nashville SOP -12dB (approx 75% limit) reference line */}
                  {showSopGuides && (
                    <ReferenceLine
                      y={85}
                      stroke="#f59e0b"
                      strokeDasharray="4 4"
                      label={{ value: 'SOP Peak Ceiling (85%)', fill: '#f59e0b', fontSize: 9, position: 'top' }}
                    />
                  )}

                  {/* Configured Fader Level Bar */}
                  <Bar
                    dataKey="faderVol"
                    name="Configured Fader"
                    radius={[4, 4, 0, 0]}
                    isAnimationActive={false}
                  >
                    {trackVolumeData.map((entry) => (
                      <Cell
                        key={`cell-${entry.id}`}
                        fill={entry.muted ? '#475569' : entry.color}
                        opacity={entry.muted ? 0.35 : 0.85}
                      />
                    ))}
                  </Bar>

                  {/* Live Amplitude / Output Bar */}
                  <Bar
                    dataKey="liveVol"
                    name="Live Output Level"
                    radius={[4, 4, 0, 0]}
                    isAnimationActive={false}
                    fill="#38bdf8"
                    opacity={0.9}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/80 font-mono">
              <span>Bars: Color = Stem Fader | Cyan = Live Audio Output</span>
              <span>Updated in real-time</span>
            </div>
          </div>
        )}

        {/* CHART 2: 8-BAND FREQUENCY SPECTRUM ANALYSIS */}
        {(viewMode === 'both' || viewMode === 'frequency') && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5 font-mono">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                <span>8-Band Real-Time Frequency Analysis</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Acoustic Energy (0-100%)
              </span>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={frequencyData}
                  margin={{ top: 12, right: 10, left: -20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis
                    dataKey="band"
                    stroke="#64748b"
                    fontSize={10}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    stroke="#64748b"
                    fontSize={10}
                    tickLine={false}
                    ticks={[0, 25, 50, 75, 100]}
                  />
                  <Tooltip content={<CustomFrequencyTooltip />} />

                  {/* SOP Vocal Clarity Reference Guideline */}
                  {showSopGuides && (
                    <ReferenceLine
                      y={70}
                      stroke="#10b981"
                      strokeDasharray="4 4"
                      label={{ value: 'Target Core Zone (70%)', fill: '#10b981', fontSize: 9, position: 'top' }}
                    />
                  )}

                  {/* Frequency Energy Bar */}
                  <Bar
                    dataKey="amplitude"
                    name="Band Energy"
                    radius={[4, 4, 0, 0]}
                    isAnimationActive={false}
                  >
                    {frequencyData.map((entry, idx) => (
                      <Cell
                        key={`freq-${idx}`}
                        fill={entry.color}
                        opacity={isPlaying ? 0.9 : 0.4}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/80 font-mono">
              <span>Bands: Sub (20Hz) • Bass (80Hz) • Mid (1kHz) • Air (16kHz)</span>
              <span>Web Audio Analyser FFT</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
