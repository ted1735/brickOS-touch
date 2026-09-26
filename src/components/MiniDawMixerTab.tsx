import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Square,
  Volume2,
  Sliders,
  Scissors,
  Activity,
  HardDrive,
  Music,
  Download,
  Check,
  Sparkles
} from 'lucide-react';
import { Track, MixerTrack } from '../types';
import { audioMiniDaw } from '../utils/audioEngine';
import { HelpCircle } from 'lucide-react';
import { SectionQuickHelpBanner } from './SectionQuickHelpBanner';

interface MiniDawMixerTabProps {
  track: Track;
  onOpenSectionGuide?: (sectionId?: any) => void;
  isDarkMode?: boolean;
}

const INITIAL_STEMS: MixerTrack[] = [
  { id: 1, name: "Track 1: Master Instrumental", vol: 90, pan: 0, muted: false, solo: false, trimIn: 0, trimOut: 100, freq: 110, waveType: 'sawtooth', color: '#6366f1' },
  { id: 2, name: "Track 2: Dry Vocal (UVR5)", vol: 95, pan: 0, muted: false, solo: false, trimIn: 0, trimOut: 100, freq: 220, waveType: 'triangle', color: '#10b981' },
  { id: 3, name: "Track 3: Harmonies & Ad-libs", vol: 75, pan: -20, muted: false, solo: false, trimIn: 0, trimOut: 100, freq: 330, waveType: 'sine', color: '#f59e0b' },
  { id: 4, name: "Track 4: Click & Ambient Plate", vol: 60, pan: 20, muted: false, solo: false, trimIn: 0, trimOut: 100, freq: 440, waveType: 'square', color: '#ec4899' }
];

export const MiniDawMixerTab: React.FC<MiniDawMixerTabProps> = ({
  track,
  onOpenSectionGuide,
  isDarkMode = true
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [masterVolume, setMasterVolume] = useState(85);
  const [tracks, setTracks] = useState<MixerTrack[]>(INITIAL_STEMS);
  const [isExportingWav, setIsExportingWav] = useState(false);
  const [cropPreset, setCropPreset] = useState<'30s' | '60s' | 'full'>('60s');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Toggle playback
  const handleTogglePlay = () => {
    if (isPlaying) {
      audioMiniDaw.stopPlayback();
      setIsPlaying(false);
    } else {
      audioMiniDaw.startPlayback(tracks, track.bpm);
      setIsPlaying(true);
    }
  };

  // Export 24-Bit lossless WAV
  const handleExportWav = async () => {
    setIsExportingWav(true);
    try {
      const wavBlob = await audioMiniDaw.export24BitWav(tracks, track.bpm, cropPreset === '30s' ? 5 : cropPreset === '60s' ? 8 : 12);
      const url = URL.createObjectURL(wavBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${track.id}_${track.title.replace(/\s+/g, '_')}_24Bit_Lossless_Master.wav`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export WAV:', err);
    } finally {
      setIsExportingWav(false);
    }
  };

  // Update track state
  const handleUpdateTrack = (id: number, field: keyof MixerTrack, val: any) => {
    const updated = tracks.map(t => (t.id === id ? { ...t, [field]: val } : t));
    setTracks(updated);

    const targetTrack = updated.find(t => t.id === id);
    if (targetTrack) {
      const hasSolo = updated.some(t => t.solo);
      audioMiniDaw.updateTrackControls(id, targetTrack.vol, targetTrack.pan, targetTrack.muted, hasSolo, targetTrack.solo);
    }
  };

  // Handle master volume
  const handleMasterVolChange = (val: number) => {
    setMasterVolume(val);
    audioMiniDaw.setMasterVolume(val);
  };

  // Real-time canvas rendering loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const analyser = audioMiniDaw.getAnalyser();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background subtle grid
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      if (analyser && isPlaying) {
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);

        // Frequency Bars
        const barWidth = (canvas.width / bufferLength) * 2.2;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * canvas.height * 0.85;

          const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
          gradient.addColorStop(0, '#4f46e5');
          gradient.addColorStop(0.5, '#06b6d4');
          gradient.addColorStop(1, '#10b981');

          ctx.fillStyle = gradient;
          ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);

          x += barWidth;
        }

        // Oscilloscope Line
        const timeData = new Uint8Array(bufferLength);
        analyser.getByteTimeDomainData(timeData);

        ctx.lineWidth = 2;
        ctx.strokeStyle = '#38bdf8';
        ctx.beginPath();
        const sliceWidth = canvas.width / bufferLength;
        let lineX = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = timeData[i] / 128.0;
          const y = (v * canvas.height) / 2;
          if (i === 0) ctx.moveTo(lineX, y);
          else ctx.lineTo(lineX, y);
          lineX += sliceWidth;
        }
        ctx.stroke();
      } else {
        // Idle state waveform line
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#334155';
        ctx.beginPath();
        ctx.moveTo(0, canvas.height / 2);
        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();

        ctx.fillStyle = '#64748b';
        ctx.font = '11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('AUDIO ENGINE STANDBY • 24-BIT / 48kHz PCM SUMMING BUS', canvas.width / 2, canvas.height / 2 - 12);
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlaying]);

  return (
    <div className="space-y-4">
      {/* SECTION QUICK HELP BANNER & SOP GUIDE */}
      <SectionQuickHelpBanner
        sectionId="mixer"
        onOpenModalGuide={(sec) => onOpenSectionGuide?.(sec || 'mixer')}
        isDarkMode={isDarkMode}
      />

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
        {/* Header Bar */}
        <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <span>4-Track Lossless Waveform Mixer & Trimmer (Mini-DAW)</span>
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-mono text-[10px] font-bold border border-emerald-700/40">
                24-Bit / 48kHz PCM Lossless
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Precision stem balancing for {track.title} ({track.bpm} BPM • {track.key}) with real-time Web Audio API summing.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {onOpenSectionGuide && (
              <button
                type="button"
                onClick={() => onOpenSectionGuide('mixer')}
                className="px-3.5 py-2 rounded-xl bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 text-xs font-bold border border-amber-700/50 flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                title="Open Mini-DAW Mixer Operating Guide & SOP Rules"
              >
                <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>How To Use Mixer</span>
              </button>
            )}

            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px] font-bold">
            <span className="text-slate-500 px-1.5 font-mono text-[10px]">CROP:</span>
            {(['30s', '60s', 'full'] as const).map(p => (
              <button
                key={p}
                onClick={() => setCropPreset(p)}
                className={`px-2 py-1 rounded-lg transition ${
                  cropPreset === p ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {p === '30s' ? '30s Hook' : p === '60s' ? '60s Radio' : 'Full Song'}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportWav}
            disabled={isExportingWav}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition disabled:opacity-50"
            title="Export Lossless 24-Bit / 48kHz WAV Master"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isExportingWav ? 'Rendering...' : 'Bounce 24-Bit WAV'}</span>
          </button>

          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <Volume2 className="w-4 h-4 text-slate-400" />
            <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">Master</span>
            <input
              type="range"
              min="0"
              max="100"
              value={masterVolume}
              onChange={(e) => handleMasterVolChange(parseInt(e.target.value))}
              className="w-20 accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <span className="text-xs font-mono font-bold text-indigo-300 w-8 text-right">{masterVolume}%</span>
          </div>

          <button
            onClick={handleTogglePlay}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 shadow-lg transition ${
              isPlaying
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-950'
            }`}
          >
            {isPlaying ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            <span>{isPlaying ? 'Stop' : 'Play 4-Track'}</span>
          </button>
        </div>
      </div>

      {/* Visualizer Canvas */}
      <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 relative shadow-inner">
        <canvas
          ref={canvasRef}
          width={900}
          height={140}
          className="w-full h-32 block"
        />
        <div className="absolute top-2 right-3 flex items-center gap-3 text-[10px] font-mono text-slate-400">
          <span className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'}`}></span>
            {isPlaying ? 'PLAYING • LIVE SUM' : 'PAUSED'}
          </span>
          <span>SR: 48,000 Hz</span>
        </div>
      </div>

      {/* 4 Track Strips */}
      <div className="space-y-3">
        {tracks.map((trk, i) => (
          <div
            key={trk.id}
            className="bg-slate-950 border border-slate-800/90 rounded-xl p-4 flex items-center justify-between flex-wrap gap-4 hover:border-slate-700 transition"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-white text-xs shadow-md"
                style={{ backgroundColor: trk.color }}
              >
                {i + 1}
              </div>
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <span>{trk.name}</span>
                </h4>
                <span className="text-[10px] font-mono text-slate-500">
                  WebDAV: ncted/brickOS/{track.id}/stems/{trk.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.wav
                </span>
              </div>
            </div>

            {/* Faders & Knobs */}
            <div className="flex items-center gap-5 flex-wrap">
              {/* Mute / Solo */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleUpdateTrack(trk.id, 'muted', !trk.muted)}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold transition font-mono ${
                    trk.muted
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                  }`}
                  title="Mute Track"
                >
                  M
                </button>
                <button
                  onClick={() => handleUpdateTrack(trk.id, 'solo', !trk.solo)}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold transition font-mono ${
                    trk.solo
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                  }`}
                  title="Solo Track"
                >
                  S
                </button>
              </div>

              {/* Stereo Pan */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase text-slate-500">Pan</span>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={trk.pan}
                  onChange={(e) => handleUpdateTrack(trk.id, 'pan', parseInt(e.target.value))}
                  className="w-16 accent-indigo-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
                />
                <span className="text-[10px] font-mono text-slate-400 w-8 text-center">
                  {trk.pan === 0 ? 'C' : trk.pan < 0 ? `L${Math.abs(trk.pan)}` : `R${trk.pan}`}
                </span>
              </div>

              {/* Volume Slider */}
              <div className="flex items-center gap-2">
                <Volume2 className="w-3.5 h-3.5 text-slate-400" />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={trk.vol}
                  onChange={(e) => handleUpdateTrack(trk.id, 'vol', parseInt(e.target.value))}
                  className="w-24 accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
                <span className="text-xs font-mono text-slate-300 w-9 text-right font-bold">{trk.vol}%</span>
              </div>

              {/* Trim Markers */}
              <div className="flex items-center gap-1 text-[10px] font-mono text-slate-500 bg-slate-900 px-2 py-1 rounded-md border border-slate-800">
                <Scissors className="w-3 h-3 text-slate-400" />
                <span>0.0s – 60.0s (Hook)</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
  );
};
