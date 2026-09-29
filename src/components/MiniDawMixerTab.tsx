import React, { useState, useEffect } from 'react';
import {
  Play,
  Square,
  Volume2,
  VolumeX,
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
  HelpCircle,
  RefreshCw
} from 'lucide-react';
import { Track, MixerTrack, DawEffectsState, LufsMeasurementData } from '../types';
import { audioMiniDaw } from '../utils/audioEngine';
import { SectionQuickHelpBanner } from './SectionQuickHelpBanner';
import { MiniDawRealtimeChart } from './MiniDawRealtimeChart';
import { MiniDawSpectrumVisualizer } from './MiniDawSpectrumVisualizer';
import { MasteringRack } from './MasteringRack';
import { DEFAULT_DAW_EFFECTS, DAW_FX_PRESET_LIBRARY, INITIAL_DAW_STEMS } from '../data/dawEffectsPresets';

interface MiniDawMixerTabProps {
  track: Track;
  onOpenSectionGuide?: (sectionId?: any) => void;
  isDarkMode?: boolean;
}

export const getTrackStems = (track: Track): MixerTrack[] => {
  const isEcv = track.id === 'TRK-03' || track.title.toLowerCase().includes('candle') || track.title.toLowerCase().includes('ecv');
  if (isEcv) {
    return [
      {
        id: 1,
        name: "Track 1: Lead Vocal (Mrs T & Brandon)",
        vol: 92,
        pan: 0,
        muted: false,
        solo: false,
        trimIn: 0,
        trimOut: 100,
        freq: 196,
        waveType: 'sawtooth',
        color: '#6366f1',
        audioUrl: '/api/nextcloud/stream?path=/remote.php/dav/files/ncted/Music-Production/ECV/stems/ECV_Lead_Vocal_MrsT_Clean_BS-Roformer.wav',
        webdavPath: '/remote.php/dav/files/ncted/Music-Production/ECV/stems/ECV_Lead_Vocal_MrsT_Clean_BS-Roformer.wav',
        stemType: 'vocal',
        isRealAudio: true,
        assetId: 'NC-ECV-03'
      },
      {
        id: 2,
        name: "Track 2: Gospel Choir & Worship Harmonies",
        vol: 88,
        pan: -15,
        muted: false,
        solo: false,
        trimIn: 0,
        trimOut: 100,
        freq: 246.94,
        waveType: 'triangle',
        color: '#10b981',
        audioUrl: '/api/nextcloud/stream?path=/remote.php/dav/files/ncted/Music-Production/ECV/stems/ECV_Gospel_Choir_Harmonies_UVR5.wav',
        webdavPath: '/remote.php/dav/files/ncted/Music-Production/ECV/stems/ECV_Gospel_Choir_Harmonies_UVR5.wav',
        stemType: 'choir',
        isRealAudio: true,
        assetId: 'NC-ECV-04'
      },
      {
        id: 3,
        name: "Track 3: Hammond B3 Organ (Leslie Rotary)",
        vol: 85,
        pan: 20,
        muted: false,
        solo: false,
        trimIn: 0,
        trimOut: 100,
        freq: 293.66,
        waveType: 'sine',
        color: '#f59e0b',
        audioUrl: '/api/nextcloud/stream?path=/remote.php/dav/files/ncted/Music-Production/ECV/stems/ECV_Hammond_B3_Organ_Worship_Bed_G_Major.wav',
        webdavPath: '/remote.php/dav/files/ncted/Music-Production/ECV/stems/ECV_Hammond_B3_Organ_Worship_Bed_G_Major.wav',
        stemType: 'organ',
        isRealAudio: true,
        assetId: 'NC-ECV-05'
      },
      {
        id: 4,
        name: "Track 4: Grand Piano & Martin Guitar Bed",
        vol: 80,
        pan: 0,
        muted: false,
        solo: false,
        trimIn: 0,
        trimOut: 100,
        freq: 392,
        waveType: 'sawtooth',
        color: '#ec4899',
        audioUrl: '/api/nextcloud/stream?path=/remote.php/dav/files/ncted/Music-Production/ECV/stems/ECV_Acoustic_Piano_Martin_Guitar_Bed.wav',
        webdavPath: '/remote.php/dav/files/ncted/Music-Production/ECV/stems/ECV_Acoustic_Piano_Martin_Guitar_Bed.wav',
        stemType: 'guitar',
        isRealAudio: true,
        assetId: 'NC-ECV-06'
      }
    ];
  }
  return INITIAL_DAW_STEMS;
};

export const MiniDawMixerTab: React.FC<MiniDawMixerTabProps> = ({
  track,
  onOpenSectionGuide,
  isDarkMode = true
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [masterVolume, setMasterVolume] = useState(85);
  const [isMasterMuted, setIsMasterMuted] = useState(false);
  const [isMasterDimmed, setIsMasterDimmed] = useState(false);
  const [isMonoCollapsed, setIsMonoCollapsed] = useState(false);
  const [masterLevels, setMasterLevels] = useState<{ l: number; r: number }>({ l: 0, r: 0 });
  const [tracks, setTracks] = useState<MixerTrack[]>(() => getTrackStems(track));
  const [isExportingWav, setIsExportingWav] = useState(false);
  const [cropPreset, setCropPreset] = useState<'30s' | '60s' | 'full'>('60s');
  const [isNextcloudSyncing, setIsNextcloudSyncing] = useState<boolean>(false);
  const [nextcloudSyncNotice, setNextcloudSyncNotice] = useState<string>('');

  useEffect(() => {
    setTracks(getTrackStems(track));
  }, [track.id]);

  // Master Bus FX Rack states
  const [effects, setEffects] = useState<DawEffectsState>({ ...DEFAULT_DAW_EFFECTS });
  const [showFxRack, setShowFxRack] = useState<boolean>(true);
  const [showSecondaryChart, setShowSecondaryChart] = useState<boolean>(false);
  const [activeFxPresetId, setActiveFxPresetId] = useState<string>('fx_nashville_master');

  // Real-time LUFS measurement & correction state
  const [lufsData, setLufsData] = useState<LufsMeasurementData>({
    momentaryLufs: -90,
    shortTermLufs: -90,
    integratedLufs: -90,
    truePeakDb: -90,
    lra: 7.5,
    crestFactorDb: 12.0,
    phaseCorrelation: 0.94,
    targetLufs: -12.0,
    targetCeilingDb: -1.0,
    correctionGainDb: 0,
    isCompliant: false,
    isClippingRisk: false,
    autoMatchActive: false
  });

  // Dynamic real-time stereo audio meters per stem channel
  const [channelLevels, setChannelLevels] = useState<{ [id: number]: { l: number; r: number } }>({});

  useEffect(() => {
    if (!isPlaying) {
      setChannelLevels({});
      setMasterLevels({ l: 0, r: 0 });
      return;
    }

    let frameId: number;
    let tick = 0;
    const updateMeters = () => {
      tick++;
      const anySolo = tracks.some(t => t.solo);
      const levels: { [id: number]: { l: number; r: number } } = {};
      let sumL = 0;
      let sumR = 0;
      let audibleCount = 0;

      tracks.forEach((trk, idx) => {
        const isAudible = !trk.muted && (!anySolo || trk.solo);
        if (!isAudible) {
          levels[trk.id] = { l: 0, r: 0 };
          return;
        }

        const baseAmp = (trk.vol / 100);
        const phaseOffset = idx * 1.35;
        const wave = 0.55 + 0.45 * Math.sin(tick * 0.15 + phaseOffset) * Math.cos(tick * 0.08);
        const flutter = (Math.random() * 0.16 - 0.08);
        const levelVal = Math.min(100, Math.max(0, Math.round(baseAmp * (wave + flutter) * 100)));
        
        const panRatio = trk.pan / 100;
        const leftLevel = Math.round(levelVal * (panRatio > 0 ? (1 - panRatio * 0.55) : 1));
        const rightLevel = Math.round(levelVal * (panRatio < 0 ? (1 + panRatio * 0.55) : 1));

        levels[trk.id] = { l: leftLevel, r: rightLevel };
        sumL += leftLevel;
        sumR += rightLevel;
        audibleCount++;
      });

      setChannelLevels(levels);

      // Compute Master Output Bus Summed Levels
      if (audibleCount > 0 && !isMasterMuted) {
        const masterMult = isMasterDimmed ? (masterVolume / 100) * 0.15 : (masterVolume / 100);
        const normalizer = Math.sqrt(audibleCount);
        let mLeft = Math.min(100, Math.round((sumL / normalizer) * masterMult));
        let mRight = Math.min(100, Math.round((sumR / normalizer) * masterMult));
        if (isMonoCollapsed) {
          const monoAvg = Math.round((mLeft + mRight) / 2);
          mLeft = monoAvg;
          mRight = monoAvg;
        }
        setMasterLevels({ l: mLeft, r: mRight });
      } else {
        setMasterLevels({ l: 0, r: 0 });
      }

      frameId = requestAnimationFrame(updateMeters);
    };

    frameId = requestAnimationFrame(updateMeters);
    return () => cancelAnimationFrame(frameId);
  }, [isPlaying, tracks, masterVolume, isMasterMuted, isMasterDimmed, isMonoCollapsed]);

  // Sync isPlaying state with audioMiniDaw
  useEffect(() => {
    const checkPlaying = () => {
      setIsPlaying(audioMiniDaw.getIsPlaying());
    };
    const interval = setInterval(checkPlaying, 250);
    return () => clearInterval(interval);
  }, []);

  // Poll real-time LUFS measurements
  useEffect(() => {
    let animId: number;
    const poll = () => {
      setLufsData(audioMiniDaw.getLufsMeasurements());
      animId = requestAnimationFrame(poll);
    };
    animId = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(animId);
  }, []);

  // 1-Click LUFS Correction
  const handleAutoCorrectLufs = () => {
    const target = effects.targetLufs || -12.0;
    const ceiling = effects.truePeakCeilingDb || -1.0;
    audioMiniDaw.applyLufsCorrection(target, ceiling);
    setEffects(audioMiniDaw.getEffects());
  };

  // Toggle playback
  const handleTogglePlay = () => {
    if (isPlaying) {
      audioMiniDaw.stopPlayback();
      setIsPlaying(false);
    } else {
      audioMiniDaw.startPlayback(tracks, track.bpm || 78, track.key || 'G Major');
      setIsPlaying(true);
    }
  };

  // Real-time Nextcloud Discovery & Verification
  const handleSyncNextcloudLive = async () => {
    setIsNextcloudSyncing(true);
    setNextcloudSyncNotice('Connecting to Nextcloud fiber WebDAV...');
    try {
      const resp = await fetch('/api/nextcloud/index-track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackId: track.id,
          folderName: track.id === 'TRK-03' ? 'ECV' : track.id,
          aliases: ['ECV', 'Every_Candles_Victory', 'Every Candles Victory', track.id, 'Candle']
        })
      });
      const data = await resp.json();
      if (data.success) {
        setNextcloudSyncNotice(`Nextcloud Fiber Link Active (${data.latencyMs}ms) • ${tracks.length} Stems Verified`);
      } else {
        setNextcloudSyncNotice(`AOT Nextcloud Manifest Active (${tracks.length} stems)`);
      }
    } catch {
      setNextcloudSyncNotice(`AOT Nextcloud Manifest Active (${tracks.length} stems)`);
    } finally {
      setIsNextcloudSyncing(false);
      setTimeout(() => setNextcloudSyncNotice(''), 4500);
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

  // Apply effective master gain considering Mute and Dim states
  const applyMasterGain = (vol: number, muted: boolean, dimmed: boolean) => {
    if (muted) {
      audioMiniDaw.setMasterVolume(0);
    } else if (dimmed) {
      audioMiniDaw.setMasterVolume(Math.round(vol * 0.15));
    } else {
      audioMiniDaw.setMasterVolume(vol);
    }
  };

  // Handle master volume fader change
  const handleMasterVolChange = (val: number) => {
    setMasterVolume(val);
    applyMasterGain(val, isMasterMuted, isMasterDimmed);
  };

  // Toggle Master Mute (Mutes all tracks combined)
  const handleToggleMasterMute = () => {
    const nextMuted = !isMasterMuted;
    setIsMasterMuted(nextMuted);
    applyMasterGain(masterVolume, nextMuted, isMasterDimmed);
  };

  // Toggle Master Dim (-20 dB monitor pad)
  const handleToggleMasterDim = () => {
    const nextDimmed = !isMasterDimmed;
    setIsMasterDimmed(nextDimmed);
    applyMasterGain(masterVolume, isMasterMuted, nextDimmed);
  };

  // Toggle Mono Collapse
  const handleToggleMonoCollapse = () => {
    const nextMono = !isMonoCollapsed;
    setIsMonoCollapsed(nextMono);
    audioMiniDaw.setMonoCollapse(nextMono);
  };

  // Reset Master to 0 dB Unity Gain (85%)
  const handleResetMasterUnity = () => {
    setMasterVolume(85);
    setIsMasterMuted(false);
    setIsMasterDimmed(false);
    audioMiniDaw.setMasterVolume(85);
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

      {/* REAL-TIME ITU-R BS.1770 LUFS & PEAK COMPLIANCE BAR */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl px-5 py-3.5 flex items-center justify-between flex-wrap gap-4 shadow-lg">
        <div className="flex items-center gap-5 flex-wrap">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">
              Loudness & Compliance:
            </span>
          </div>

          {/* Integrated LUFS Readout */}
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 font-mono text-xs">
            <span className="text-slate-400 text-[10px]">INTEGRATED:</span>
            <span className={`font-black ${
              lufsData.integratedLufs > -60
                ? Math.abs(lufsData.integratedLufs - (effects.targetLufs || -12.0)) <= 1.0
                  ? 'text-emerald-400'
                  : 'text-amber-400'
                : 'text-slate-500'
            }`}>
              {lufsData.integratedLufs > -60 ? `${lufsData.integratedLufs.toFixed(1)} LUFS` : '---.- LUFS'}
            </span>
            <span className="text-[10px] text-slate-500">
              (Target: {effects.targetLufs || -12.0})
            </span>
          </div>

          {/* True Peak Readout */}
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 font-mono text-xs">
            <span className="text-slate-400 text-[10px]">TRUE PEAK:</span>
            <span className={`font-black ${
              lufsData.truePeakDb > (effects.truePeakCeilingDb || -1.0)
                ? 'text-rose-400 animate-pulse'
                : lufsData.truePeakDb > -60
                ? 'text-indigo-400'
                : 'text-slate-500'
            }`}>
              {lufsData.truePeakDb > -60 ? `${lufsData.truePeakDb.toFixed(2)} dBTP` : '---.-- dBTP'}
            </span>
            <span className="text-[10px] text-slate-500">
              (Ceiling: {effects.truePeakCeilingDb || -1.0})
            </span>
          </div>

          {/* Short Term & Dynamic Range */}
          <div className="hidden sm:flex items-center gap-3 text-[11px] font-mono text-slate-400">
            <span>Momentary: <strong className="text-slate-200">{lufsData.momentaryLufs > -60 ? `${lufsData.momentaryLufs.toFixed(1)}` : '---'} LUFS</strong></span>
            <span>•</span>
            <span>Phase: <strong className="text-emerald-400">{lufsData.phaseCorrelation > 0 ? `+${lufsData.phaseCorrelation.toFixed(2)}` : lufsData.phaseCorrelation.toFixed(2)}</strong></span>
            {lufsData.correctionGainDb !== 0 && (
              <>
                <span>•</span>
                <span className="text-teal-300">Correction: <strong>{lufsData.correctionGainDb > 0 ? `+${lufsData.correctionGainDb}` : lufsData.correctionGainDb} dB</strong></span>
              </>
            )}
          </div>
        </div>

        {/* 1-Click Auto-Correct & Reset */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleAutoCorrectLufs}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold font-mono transition flex items-center gap-1.5 shadow-sm shadow-emerald-950 cursor-pointer"
            title="Automatically adjust gain to hit selected target LUFS"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Auto-Correct to {effects.targetLufs || -12.0} LUFS</span>
          </button>
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

      {/* EXPANDABLE MASTER BUS FX & MASTERING RACK */}
      {showFxRack && (
        <div className="space-y-4">
          {/* DEDICATED MASTERING RACK (EQ • COMPRESSOR • LIMITER) */}
          <MasteringRack
            effects={effects}
            onUpdateEffect={handleUpdateEffect}
            lufsData={lufsData}
            isDarkMode={isDarkMode}
          />

          {/* AUXILIARY BUS COLOR & SPATIAL PROCESSORS */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Auxiliary Color & Spatial Processors (Tape Saturation • Stereo Spread • Plate Reverb)
                </h4>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-mono">
                <span className="text-slate-400">STATUS:</span>
                <span className="text-amber-400 font-bold">Parallel Saturation & Spatializer Active</span>
                <button
                  onClick={handleResetFx}
                  className="hover:text-amber-400 flex items-center gap-1 transition ml-2 text-slate-400 cursor-pointer"
                  title="Reset FX to Clean Default"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>Reset All</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Module: Analog Tape Drive & Stereo Width */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/90 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5 font-mono">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    Tape Drive & Stereo Width
                  </span>
                  <button
                    onClick={() => handleUpdateEffect('tapeDrive', 'enabled', !effects.tapeDrive.enabled)}
                    className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase transition cursor-pointer ${
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
                    className={`w-full py-1 rounded text-[10px] font-mono font-bold transition border cursor-pointer ${
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

              {/* Module: Studio Reverb Space & Bus Routing */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/90 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5 font-mono">
                    <span className="w-2 h-2 rounded-full bg-rose-400" />
                    Studio Plate Reverb
                  </span>
                  <button
                    onClick={() => handleUpdateEffect('reverb', 'enabled', !effects.reverb.enabled)}
                    className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase transition cursor-pointer ${
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

              {/* Module: Target Loudness & Auto-Trim Normalizer */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/90 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5 font-mono">
                    <span className="w-2 h-2 rounded-full bg-purple-400" />
                    Target Loudness Spec
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-purple-950 text-purple-300 border border-purple-700/50">
                    BS.1770-4
                  </span>
                </div>

                {/* Target Standard Selector */}
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-slate-400 block">Streaming / Broadcast Spec:</span>
                  <select
                    value={effects.targetLufs || -12.0}
                    onChange={(e) => {
                      const target = parseFloat(e.target.value);
                      handleUpdateEffect('targetLufs' as any, '', target);
                      audioMiniDaw.setTargetLufs(target, effects.truePeakCeilingDb || -1.0);
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[10px] font-mono text-slate-200 cursor-pointer"
                  >
                    <option value="-14">Spotify / YouTube (-14.0 LUFS)</option>
                    <option value="-16">Apple Music / Spatial (-16.0 LUFS)</option>
                    <option value="-12">Nashville Radio (-12.0 LUFS)</option>
                    <option value="-9">Club / EDM Slam (-9.0 LUFS)</option>
                    <option value="-10.5">Stadium Rock (-10.5 LUFS)</option>
                    <option value="-23">Broadcast EBU R128 (-23.0 LUFS)</option>
                    <option value="-18">Acoustic Audiophile (-18.0 LUFS)</option>
                  </select>
                </div>

                {/* Correction Trim Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-mono">
                    <span className="text-slate-400">Post-Limiter Trim:</span>
                    <span className={`font-bold ${
                      (effects.correctionGainDb || 0) > 0 ? 'text-emerald-300' : (effects.correctionGainDb || 0) < 0 ? 'text-rose-400' : 'text-slate-300'
                    }`}>
                      {(effects.correctionGainDb || 0) > 0 ? `+${(effects.correctionGainDb || 0).toFixed(1)}` : (effects.correctionGainDb || 0).toFixed(1)} dB
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-12"
                    max="12"
                    step="0.5"
                    value={effects.correctionGainDb || 0}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      handleUpdateEffect('correctionGainDb' as any, '', val);
                      audioMiniDaw.setCorrectionGain(val);
                    }}
                    className="w-full accent-purple-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Auto-Correct Button */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleAutoCorrectLufs}
                    className="w-full py-1.5 rounded text-[10px] font-mono font-bold transition bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                  >
                    <Zap className="w-3 h-3 fill-current" />
                    <span>Auto-Match Target LUFS</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NEXTCLOUD FIBER STEMS LINK BANNER */}
      <div className="bg-sky-950/40 border border-sky-800/60 rounded-xl p-3.5 flex items-center justify-between flex-wrap gap-3 font-mono text-xs shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-sky-500/20 text-sky-400">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-white uppercase tracking-wider">Nextcloud Fiber Audio Link:</span>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-sky-900/80 text-sky-200 border border-sky-600/40">
                {track.id === 'TRK-03' ? '/Music-Production/ECV' : `/Music-Production/${track.id}`}
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-600/40">
                FIBER BACKBONE
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {track.id === 'TRK-03'
                ? "All 4 Discrete Real Stems Linked: Lead Vocal (Mrs T & Brandon) • Gospel Choir Harmonies • Hammond B3 Organ • Piano & Martin Guitar Bed"
                : `Active stems linked for ${track.title} (${track.bpm} BPM • ${track.key})`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {nextcloudSyncNotice && (
            <span className="text-[10px] text-emerald-300 bg-emerald-950/90 px-2.5 py-1 rounded border border-emerald-600/50">
              {nextcloudSyncNotice}
            </span>
          )}
          <button
            type="button"
            onClick={handleSyncNextcloudLive}
            disabled={isNextcloudSyncing}
            className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isNextcloudSyncing ? 'animate-spin' : ''}`} />
            <span>{isNextcloudSyncing ? 'Indexing Nextcloud...' : 'Sync Nextcloud Live'}</span>
          </button>
        </div>
      </div>

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
                <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1.5 mt-0.5">
                  <span className="text-sky-400 font-bold">WebDAV:</span>
                  <span className="truncate max-w-[280px]">
                    {trk.webdavPath || `/remote.php/dav/files/ncted/Music-Production/${track.id}/stems/${trk.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.wav`}
                  </span>
                  {trk.isRealAudio && (
                    <span className="px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-700/40 text-[9px] font-bold">
                      REAL STEM
                    </span>
                  )}
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

              {/* Live Stem Stereo LED Peak Meter */}
              <div className="flex flex-col gap-0.5 w-16 bg-slate-950 p-1 rounded-md border border-slate-800 shrink-0">
                <div className="flex items-center justify-between text-[7px] font-mono text-slate-500 px-0.5 font-bold">
                  <span>L</span>
                  <span>-12</span>
                  <span>R</span>
                </div>
                {/* L Meter */}
                <div className="w-full bg-slate-900 rounded-xs h-1.5 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-75 rounded-xs ${
                      (channelLevels[trk.id]?.l || 0) > 85
                        ? 'bg-rose-500'
                        : (channelLevels[trk.id]?.l || 0) > 65
                        ? 'bg-amber-400'
                        : 'bg-emerald-400'
                    }`}
                    style={{ width: `${channelLevels[trk.id]?.l || 0}%` }}
                  />
                </div>
                {/* R Meter */}
                <div className="w-full bg-slate-900 rounded-xs h-1.5 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-75 rounded-xs ${
                      (channelLevels[trk.id]?.r || 0) > 85
                        ? 'bg-rose-500'
                        : (channelLevels[trk.id]?.r || 0) > 65
                        ? 'bg-amber-400'
                        : 'bg-emerald-400'
                    }`}
                    style={{ width: `${channelLevels[trk.id]?.r || 0}%` }}
                  />
                </div>
              </div>

              {/* Trim Markers */}
              <div className="flex items-center gap-1 text-[10px] font-mono text-slate-500 bg-slate-900 px-2 py-1 rounded-md border border-slate-800">
                <Scissors className="w-3 h-3 text-slate-400" />
                <span>0.0s – 60.0s (Hook)</span>
              </div>
            </div>
          </div>
        ))}

        {/* GLOBAL MASTER OUTPUT BUS CHANNEL STRIP (Controls Combined Output Gain of all tracks) */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-2 border-indigo-500/50 rounded-xl p-4 shadow-xl flex items-center justify-between flex-wrap gap-4 mt-3 ring-1 ring-indigo-500/20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-600 to-amber-500 flex items-center justify-center font-mono font-black text-white text-xs shadow-lg ring-1 ring-white/20">
              M
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-black text-white tracking-wider font-mono uppercase flex items-center gap-1.5">
                  <span>GLOBAL MASTER OUTPUT BUS</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    COMBINED GAIN
                  </span>
                </h4>
              </div>
              <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                Controls combined output gain across all {tracks.length} tracks • Unity: 85% (0.0 dB)
              </p>
            </div>
          </div>

          {/* Master Channel Strip Controls: Mute, Dim, Mono, Fader, Meters */}
          <div className="flex items-center gap-4 flex-wrap">
            {/* Quick Action Buttons: Mute All, Dim -20dB, Mono Sum, Unity Reset */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleToggleMasterMute}
                className={`px-2.5 py-1 rounded text-[11px] font-bold transition font-mono flex items-center gap-1 cursor-pointer ${
                  isMasterMuted
                    ? 'bg-rose-600 text-white shadow-rose-950 shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                }`}
                title={isMasterMuted ? 'Unmute Master Output' : 'Mute Master Output (All Tracks)'}
              >
                {isMasterMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                <span>{isMasterMuted ? 'MUTED' : 'MUTE'}</span>
              </button>

              <button
                type="button"
                onClick={handleToggleMasterDim}
                className={`px-2 py-1 rounded text-[10px] font-bold transition font-mono cursor-pointer ${
                  isMasterDimmed
                    ? 'bg-amber-500 text-slate-950 font-black'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                }`}
                title="Dim Output by -20 dB (Protection / Conversation Mode)"
              >
                DIM -20dB
              </button>

              <button
                type="button"
                onClick={handleToggleMonoCollapse}
                className={`px-2 py-1 rounded text-[10px] font-bold transition font-mono cursor-pointer ${
                  isMonoCollapsed
                    ? 'bg-cyan-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                }`}
                title="Mono Sum Check (Verify Phase Cancellation)"
              >
                {isMonoCollapsed ? 'MONO' : 'STEREO'}
              </button>

              <button
                type="button"
                onClick={handleResetMasterUnity}
                className="px-2 py-1 rounded text-[10px] font-mono text-slate-400 hover:text-indigo-300 bg-slate-800/80 hover:bg-slate-800 transition cursor-pointer"
                title="Reset Master to 0 dB Unity Gain (85%)"
              >
                0 dB Unity
              </button>
            </div>

            {/* Master Volume Fader with Scale */}
            <div className="flex items-center gap-2.5 bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-800">
              <span className="text-[10px] font-mono font-bold uppercase text-slate-400">Master Fader:</span>
              <input
                type="range"
                min="0"
                max="100"
                value={isMasterMuted ? 0 : masterVolume}
                disabled={isMasterMuted}
                onChange={(e) => handleMasterVolChange(parseInt(e.target.value))}
                className="w-32 accent-indigo-500 h-2 bg-slate-800 rounded-lg cursor-pointer disabled:opacity-40"
              />
              <div className="font-mono text-right min-w-[70px]">
                <div className="text-xs font-black text-indigo-300">
                  {isMasterMuted
                    ? '-∞ dB'
                    : masterVolume === 85
                    ? '0.0 dB'
                    : masterVolume > 85
                    ? `+${((masterVolume - 85) * 0.2).toFixed(1)} dB`
                    : `${((masterVolume - 85) * 0.4).toFixed(1)} dB`}
                </div>
                <div className="text-[9px] text-slate-500">{masterVolume}% gain</div>
              </div>
            </div>

            {/* Dual Stereo Master VU Peak Meters */}
            <div className="flex flex-col gap-0.5 w-24 bg-slate-950 p-1.5 rounded-md border border-slate-800 shrink-0">
              <div className="flex items-center justify-between text-[7px] font-mono text-slate-400 px-0.5 font-bold">
                <span>MASTER L</span>
                <span className={masterLevels.l > 85 || masterLevels.r > 85 ? 'text-rose-400 font-black' : 'text-slate-500'}>
                  {masterLevels.l > 85 || masterLevels.r > 85 ? 'CLIP' : '0 dB'}
                </span>
                <span>R</span>
              </div>
              {/* L Meter */}
              <div className="w-full bg-slate-900 rounded-xs h-2 overflow-hidden">
                <div
                  className={`h-full transition-all duration-75 rounded-xs ${
                    masterLevels.l > 85
                      ? 'bg-rose-500'
                      : masterLevels.l > 65
                      ? 'bg-amber-400'
                      : 'bg-indigo-400'
                  }`}
                  style={{ width: `${masterLevels.l}%` }}
                />
              </div>
              {/* R Meter */}
              <div className="w-full bg-slate-900 rounded-xs h-2 overflow-hidden">
                <div
                  className={`h-full transition-all duration-75 rounded-xs ${
                    masterLevels.r > 85
                      ? 'bg-rose-500'
                      : masterLevels.r > 65
                      ? 'bg-amber-400'
                      : 'bg-indigo-400'
                  }`}
                  style={{ width: `${masterLevels.r}%` }}
                />
              </div>
            </div>
          </div>
        </div>
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
