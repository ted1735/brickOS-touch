import React, { useState, useEffect } from 'react';
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
  Sparkles,
  SlidersHorizontal,
  Layers,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Zap,
  Radio,
  Eye,
  BarChart3,
  HelpCircle
} from 'lucide-react';
import { Track, MixerTrack, DawEffectsState } from '../types';
import { audioMiniDaw } from '../utils/audioEngine';
import { SectionQuickHelpBanner } from './SectionQuickHelpBanner';
import { MiniDawRealtimeChart } from './MiniDawRealtimeChart';
import { MiniDawSpectrumVisualizer } from './MiniDawSpectrumVisualizer';
import { DEFAULT_DAW_EFFECTS, DAW_FX_PRESET_LIBRARY, INITIAL_DAW_STEMS } from '../data/dawEffectsPresets';

interface MiniDawMixerTabProps {
  track: Track;
  onOpenSectionGuide?: (sectionId?: any) => void;
  isDarkMode?: boolean;
}

export const MiniDawMixerTab: React.FC<MiniDawMixerTabProps> = ({
  track,
  onOpenSectionGuide,
  isDarkMode = true
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [masterVolume, setMasterVolume] = useState(85);
  const [tracks, setTracks] = useState<MixerTrack[]>(INITIAL_DAW_STEMS);
  const [isExportingWav, setIsExportingWav] = useState(false);
  const [cropPreset, setCropPreset] = useState<'30s' | '60s' | 'full'>('60s');

  // Master Bus FX Rack states
  const [effects, setEffects] = useState<DawEffectsState>({ ...DEFAULT_DAW_EFFECTS });
  const [showFxRack, setShowFxRack] = useState<boolean>(true);
  const [showSecondaryChart, setShowSecondaryChart] = useState<boolean>(false);
  const [activeFxPresetId, setActiveFxPresetId] = useState<string>('fx_nashville_master');

  // Sync isPlaying state with audioMiniDaw
  useEffect(() => {
    const checkPlaying = () => {
      setIsPlaying(audioMiniDaw.getIsPlaying());
    };
    const interval = setInterval(checkPlaying, 250);
    return () => clearInterval(interval);
  }, []);

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
      const wavBlob = await audioMiniDaw.export24BitWav(
        tracks,
        track.bpm,
        cropPreset === '30s' ? 5 : cropPreset === '60s' ? 8 : 12,
        effects
      );
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
    const updated = tracks.map((t) => (t.id === id ? { ...t, [field]: val } : t));
    setTracks(updated);

    const targetTrack = updated.find((t) => t.id === id);
    if (targetTrack) {
      const hasSolo = updated.some((t) => t.solo);
      audioMiniDaw.updateTrackControls(id, targetTrack.vol, targetTrack.pan, targetTrack.muted, hasSolo, targetTrack.solo);
    }
  };

  // Handle master volume
  const handleMasterVolChange = (val: number) => {
    setMasterVolume(val);
    audioMiniDaw.setMasterVolume(val);
  };

  // Update Effects parameter and immediately push to Web Audio graph
  const handleUpdateEffect = <K extends keyof DawEffectsState>(category: K, param: string, value: any) => {
    const currentCat = effects[category];
    const updatedCat = typeof currentCat === 'object' && currentCat !== null ? { ...currentCat, [param]: value } : value;

    const newEffects: DawEffectsState = {
      ...effects,
      [category]: updatedCat,
      activeFxPresetName: 'Custom'
    };

    setEffects(newEffects);
    audioMiniDaw.setEffects(newEffects);
    setActiveFxPresetId('');
  };

  // Switch FX Presets
  const handleSelectFxPreset = (presetId: string) => {
    const found = DAW_FX_PRESET_LIBRARY.find((p) => p.id === presetId);
    if (!found) return;

    setActiveFxPresetId(presetId);
    setEffects(found.effects);
    audioMiniDaw.setEffects(found.effects);
  };

  // Reset FX to neutral
  const handleResetFx = () => {
    setEffects(DEFAULT_DAW_EFFECTS);
    audioMiniDaw.setEffects(DEFAULT_DAW_EFFECTS);
    setActiveFxPresetId('fx_nashville_master');
  };

  return (
    <div className="space-y-5">
      {/* SECTION QUICK HELP BANNER & SOP GUIDE */}
      <SectionQuickHelpBanner
        sectionId="mixer"
        onOpenModalGuide={(sec) => onOpenSectionGuide?.(sec || 'mixer')}
        isDarkMode={isDarkMode}
      />

      {/* Main Transport & Master Control Console */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span>4-Track Lossless Waveform Mixer & Trimmer (Mini-DAW)</span>
              </h3>
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-mono text-[10px] font-bold border border-emerald-700/40">
                24-Bit / 48kHz PCM Lossless
              </span>
              <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-400 font-mono text-[10px] font-bold border border-indigo-700/40">
                Live Web Audio Analyser
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Precision stem balancing for {track.title} ({track.bpm} BPM • {track.key}) with real-time 3-band EQ, compressor, and tape saturation.
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

            {/* Crop Preset Selector */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px] font-bold">
              <span className="text-slate-500 px-1.5 font-mono text-[10px]">CROP:</span>
              {(['30s', '60s', 'full'] as const).map((p) => (
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

            {/* Lossless 24-Bit WAV Export */}
            <button
              onClick={handleExportWav}
              disabled={isExportingWav}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition disabled:opacity-50"
              title="Export Lossless 24-Bit / 48kHz WAV Master"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isExportingWav ? 'Rendering...' : 'Bounce 24-Bit WAV'}</span>
            </button>

            {/* Master Volume Slider */}
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

            {/* Master Transport Play/Stop Button */}
            <button
              onClick={handleTogglePlay}
              className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 shadow-lg transition cursor-pointer ${
                isPlaying
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950 ring-2 ring-rose-500/50'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-950'
              }`}
            >
              {isPlaying ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              <span>{isPlaying ? 'Stop Playback' : 'Play 4-Track'}</span>
            </button>
          </div>
        </div>

        {/* Master FX Presets Quick Selector */}
        <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-mono font-bold text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>FX PRESET:</span>
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {DAW_FX_PRESET_LIBRARY.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleSelectFxPreset(preset.id)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition flex items-center gap-1 ${
                    activeFxPresetId === preset.id
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800'
                  }`}
                  title={preset.description}
                >
                  <span>{preset.name}</span>
                  <span className="text-[9px] opacity-70">({preset.tag})</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFxRack(!showFxRack)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono flex items-center gap-1.5 transition border ${
                showFxRack
                  ? 'bg-slate-800 border-indigo-500/50 text-indigo-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <SlidersHorizontal className="w-3 h-3" />
              <span>Master FX Rack</span>
              {showFxRack ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            <button
              onClick={() => setShowSecondaryChart(!showSecondaryChart)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono flex items-center gap-1.5 transition border ${
                showSecondaryChart
                  ? 'bg-slate-800 border-slate-700 text-slate-200'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3 h-3" />
              <span>Stem Fader Telemetry</span>
            </button>
          </div>
        </div>
      </div>

      {/* REAL-TIME FREQUENCY SPECTRUM VISUALIZER (CANVAS) */}
      <MiniDawSpectrumVisualizer
        analyser={audioMiniDaw.getAnalyser()}
        isPlaying={isPlaying}
        isDarkMode={isDarkMode}
        trackTitle={track.title}
        bpm={track.bpm}
        keySignature={track.key}
      />

      {/* EXPANDABLE MASTER BUS FX & SONIC SCULPTING RACK */}
      {showFxRack && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl transition-all">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Master Bus Audio Engine Processing (Live Web Audio DSP)
              </h4>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono">
              <span className="text-slate-400">ACTIVE CHAIN:</span>
              <span className="text-emerald-400 font-bold">
                Master Gain ➔ 3-Band EQ ➔ Tape Saturation ➔ VCA Dynamics ➔ Plate Reverb ➔ 1024 FFT
              </span>
              <button
                onClick={handleResetFx}
                className="hover:text-amber-400 flex items-center gap-1 transition ml-2 text-slate-400"
                title="Reset FX to Clean Default"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span>Reset FX</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Module 1: 3-Band Parametric EQ */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/90 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5 font-mono">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  3-Band Master EQ
                </span>
                <button
                  onClick={() => handleUpdateEffect('eq', 'enabled', !effects.eq.enabled)}
                  className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase transition ${
                    effects.eq.enabled ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/50' : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {effects.eq.enabled ? 'Active' : 'Bypass'}
                </button>
              </div>

              {/* Low Shelf */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-slate-400">LOW (80 Hz Shelf):</span>
                  <span className={`font-bold ${effects.eq.low > 0 ? 'text-cyan-300' : effects.eq.low < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                    {effects.eq.low > 0 ? `+${effects.eq.low.toFixed(1)}` : effects.eq.low.toFixed(1)} dB
                  </span>
                </div>
                <input
                  type="range"
                  min="-12"
                  max="12"
                  step="0.5"
                  value={effects.eq.low}
                  onChange={(e) => handleUpdateEffect('eq', 'low', parseFloat(e.target.value))}
                  disabled={!effects.eq.enabled}
                  className="w-full accent-cyan-500 h-1 bg-slate-800 rounded-lg cursor-pointer disabled:opacity-40"
                />
              </div>

              {/* Mid Bell */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-slate-400">MID (1 kHz Bell):</span>
                  <span className={`font-bold ${effects.eq.mid > 0 ? 'text-teal-300' : effects.eq.mid < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                    {effects.eq.mid > 0 ? `+${effects.eq.mid.toFixed(1)}` : effects.eq.mid.toFixed(1)} dB
                  </span>
                </div>
                <input
                  type="range"
                  min="-12"
                  max="12"
                  step="0.5"
                  value={effects.eq.mid}
                  onChange={(e) => handleUpdateEffect('eq', 'mid', parseFloat(e.target.value))}
                  disabled={!effects.eq.enabled}
                  className="w-full accent-teal-500 h-1 bg-slate-800 rounded-lg cursor-pointer disabled:opacity-40"
                />
              </div>

              {/* High Shelf */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-slate-400">HIGH (10 kHz Shelf):</span>
                  <span className={`font-bold ${effects.eq.high > 0 ? 'text-emerald-300' : effects.eq.high < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                    {effects.eq.high > 0 ? `+${effects.eq.high.toFixed(1)}` : effects.eq.high.toFixed(1)} dB
                  </span>
                </div>
                <input
                  type="range"
                  min="-12"
                  max="12"
                  step="0.5"
                  value={effects.eq.high}
                  onChange={(e) => handleUpdateEffect('eq', 'high', parseFloat(e.target.value))}
                  disabled={!effects.eq.enabled}
                  className="w-full accent-emerald-500 h-1 bg-slate-800 rounded-lg cursor-pointer disabled:opacity-40"
                />
              </div>
            </div>

            {/* Module 2: VCA Dynamics Bus Compressor */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/90 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5 font-mono">
                  <span className="w-2 h-2 rounded-full bg-indigo-400" />
                  VCA Bus Compressor
                </span>
                <button
                  onClick={() => handleUpdateEffect('compressor', 'enabled', !effects.compressor.enabled)}
                  className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase transition ${
                    effects.compressor.enabled ? 'bg-indigo-950 text-indigo-300 border border-indigo-700/50' : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {effects.compressor.enabled ? 'Active' : 'Bypass'}
                </button>
              </div>

              {/* Threshold */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-slate-400">Threshold:</span>
                  <span className="font-bold text-indigo-300">{effects.compressor.threshold} dB</span>
                </div>
                <input
                  type="range"
                  min="-40"
                  max="0"
                  step="1"
                  value={effects.compressor.threshold}
                  onChange={(e) => handleUpdateEffect('compressor', 'threshold', parseFloat(e.target.value))}
                  disabled={!effects.compressor.enabled}
                  className="w-full accent-indigo-500 h-1 bg-slate-800 rounded-lg cursor-pointer disabled:opacity-40"
                />
              </div>

              {/* Ratio */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-slate-400">Ratio:</span>
                  <span className="font-bold text-indigo-300">{effects.compressor.ratio.toFixed(1)}:1</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.5"
                  value={effects.compressor.ratio}
                  onChange={(e) => handleUpdateEffect('compressor', 'ratio', parseFloat(e.target.value))}
                  disabled={!effects.compressor.enabled}
                  className="w-full accent-indigo-500 h-1 bg-slate-800 rounded-lg cursor-pointer disabled:opacity-40"
                />
              </div>

              {/* Makeup Gain */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-slate-400">Makeup Gain:</span>
                  <span className="font-bold text-indigo-300">+{effects.compressor.makeup.toFixed(1)} dB</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="8"
                  step="0.5"
                  value={effects.compressor.makeup}
                  onChange={(e) => handleUpdateEffect('compressor', 'makeup', parseFloat(e.target.value))}
                  disabled={!effects.compressor.enabled}
                  className="w-full accent-indigo-500 h-1 bg-slate-800 rounded-lg cursor-pointer disabled:opacity-40"
                />
              </div>
            </div>

            {/* Module 3: Analog Tape Drive & Stereo Width */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/90 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5 font-mono">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  Tape Drive & Stereo
                </span>
                <button
                  onClick={() => handleUpdateEffect('tapeDrive', 'enabled', !effects.tapeDrive.enabled)}
                  className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase transition ${
                    effects.tapeDrive.enabled ? 'bg-amber-950 text-amber-300 border border-amber-700/50' : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {effects.tapeDrive.enabled ? 'Active' : 'Bypass'}
                </button>
              </div>

              {/* Drive Saturation */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-slate-400">Tape Saturation:</span>
                  <span className="font-bold text-amber-300">{effects.tapeDrive.drive}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={effects.tapeDrive.drive}
                  onChange={(e) => handleUpdateEffect('tapeDrive', 'drive', parseInt(e.target.value))}
                  disabled={!effects.tapeDrive.enabled}
                  className="w-full accent-amber-500 h-1 bg-slate-800 rounded-lg cursor-pointer disabled:opacity-40"
                />
              </div>

              {/* Stereo Width */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-slate-400">Stereo Spread:</span>
                  <span className="font-bold text-amber-300">{effects.stereo.width}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={effects.stereo.width}
                  onChange={(e) => handleUpdateEffect('stereo', 'width', parseInt(e.target.value))}
                  className="w-full accent-amber-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Mono Collapse Button */}
              <div className="pt-1">
                <button
                  onClick={() => handleUpdateEffect('stereo', 'isMonoCollapse', !effects.stereo.isMonoCollapse)}
                  className={`w-full py-1 rounded text-[10px] font-mono font-bold transition border ${
                    effects.stereo.isMonoCollapse
                      ? 'bg-rose-950/80 border-rose-600 text-rose-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                  title="Check phase cancellation with Mono summing"
                >
                  {effects.stereo.isMonoCollapse ? '⚠ MONO COLLAPSE ENGAGED' : 'Mono Compatibility Check'}
                </button>
              </div>
            </div>

            {/* Module 4: Studio Reverb Space & Bus Routing */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/90 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5 font-mono">
                  <span className="w-2 h-2 rounded-full bg-rose-400" />
                  Studio Plate Reverb
                </span>
                <button
                  onClick={() => handleUpdateEffect('reverb', 'enabled', !effects.reverb.enabled)}
                  className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase transition ${
                    effects.reverb.enabled ? 'bg-rose-950 text-rose-300 border border-rose-700/50' : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {effects.reverb.enabled ? 'Active' : 'Bypass'}
                </button>
              </div>

              {/* Reverb Mix */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-slate-400">Wet/Dry Mix:</span>
                  <span className="font-bold text-rose-300">{effects.reverb.mix}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="60"
                  value={effects.reverb.mix}
                  onChange={(e) => handleUpdateEffect('reverb', 'mix', parseInt(e.target.value))}
                  disabled={!effects.reverb.enabled}
                  className="w-full accent-rose-500 h-1 bg-slate-800 rounded-lg cursor-pointer disabled:opacity-40"
                />
              </div>

              {/* Reverb Decay */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-slate-400">Decay Time:</span>
                  <span className="font-bold text-rose-300">{effects.reverb.decay.toFixed(1)}s</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="5.0"
                  step="0.1"
                  value={effects.reverb.decay}
                  onChange={(e) => handleUpdateEffect('reverb', 'decay', parseFloat(e.target.value))}
                  disabled={!effects.reverb.enabled}
                  className="w-full accent-rose-500 h-1 bg-slate-800 rounded-lg cursor-pointer disabled:opacity-40"
                />
              </div>

              {/* Bus Routing */}
              <div className="space-y-1 pt-1">
                <span className="text-[10px] font-mono text-slate-400 block">Bus Routing Solo:</span>
                <select
                  value={effects.busRouting}
                  onChange={(e) => {
                    const bus = e.target.value as any;
                    handleUpdateEffect('busRouting', '', bus);
                    audioMiniDaw.updateBusRouting(bus, tracks);
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[10px] font-mono text-slate-200 cursor-pointer"
                >
                  <option value="master">All Stems (Master Bus)</option>
                  <option value="vocal">Vocal Isolation (Stem 2)</option>
                  <option value="instrumental">Instrumental Bus (Stem 1+4)</option>
                  <option value="suno">Suno Master Bus (Stem 1)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4 Track Strips */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400 font-mono px-1">
          <span className="font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>4-Channel Stem Mixer & UVR5 Pre-Master Channels</span>
          </span>
          <span>Sample Rate: 48,000 Hz • Bit-Depth: 24-Bit Linear PCM</span>
        </div>

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

      {/* OPTIONAL SECONDARY RECHARTS TELEMETRY (COLLAPSIBLE) */}
      {showSecondaryChart && (
        <div className="pt-2">
          <div className="text-xs font-mono text-slate-400 mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-slate-300 font-bold">
              <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Stem Fader Amplitude & ISO-Standard RMS Telemetry</span>
            </span>
            <button
              onClick={() => setShowSecondaryChart(false)}
              className="text-[10px] text-slate-500 hover:text-slate-300"
            >
              Hide Panel ✕
            </button>
          </div>
          <MiniDawRealtimeChart
            tracks={tracks}
            masterVolume={masterVolume}
            isPlaying={isPlaying}
            analyser={audioMiniDaw.getAnalyser()}
            isDarkMode={isDarkMode}
          />
        </div>
      )}
    </div>
  );
};
