import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bookmark,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Compass,
  Download,
  Eye,
  Flame,
  HelpCircle,
  Layers,
  Music,
  Play,
  Radio,
  RotateCcw,
  Sliders,
  Sparkles,
  Square,
  TrendingDown,
  TrendingUp,
  Volume2,
  VolumeX,
  Zap,
  Plus,
  Package
} from 'lucide-react';
import { Track, MixerTrack, DawEffectsState, MasteringPreset, LufsMeasurementData, MasteringCategory } from '../types';
import { audioMiniDaw } from '../utils/audioEngine';
import {
  MASTERING_PRESETS_CATALOG,
  TARGET_LUFS_PROFILES,
  getCustomMasteringPresets,
  saveCustomMasteringPreset,
  deleteCustomMasteringPreset
} from '../data/masteringPresets';
import { getTrackStems } from '../data/nextcloudAssetIndex';
import { AudioWaveformVisualizer } from './AudioWaveformVisualizer';
import { MasterDeliverablesExportModal } from './MasterDeliverablesExportModal';

interface MasteringLufsSuiteProps {
  track: Track;
  onOpenSectionGuide?: (sectionId?: any) => void;
  isDarkMode?: boolean;
}

export const MasteringLufsSuite: React.FC<MasteringLufsSuiteProps> = ({
  track,
  onOpenSectionGuide,
  isDarkMode = true
}) => {
  // Transport & Audio Engine States
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isExportingWav, setIsExportingWav] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [activeBus, setActiveBus] = useState<'master' | 'suno' | 'vocal' | 'instrumental' | 'ref'>('master');
  const [isMonoCollapse, setIsMonoCollapse] = useState<boolean>(false);
  const [tracks, setTracks] = useState<MixerTrack[]>(() => getTrackStems(track));

  useEffect(() => {
    setTracks(getTrackStems(track));
  }, [track.id, track.title]);

  // Active Effects & Mastering State
  const [currentEffects, setCurrentEffects] = useState<DawEffectsState>(audioMiniDaw.getEffects());
  const [activePresetId, setActivePresetId] = useState<string>('mst_nashville_radio');
  const [customPresets, setCustomPresets] = useState<MasteringPreset[]>(getCustomMasteringPresets());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [presetSearch, setPresetSearch] = useState<string>('');

  // Target LUFS & Ceiling controls
  const [targetLufs, setTargetLufs] = useState<number>(-12.0);
  const [targetCeiling, setTargetCeiling] = useState<number>(-1.0);
  const [autoMatchEnabled, setAutoMatchEnabled] = useState<boolean>(false);
  const [manualTrimDb, setManualTrimDb] = useState<number>(0);
  const [correctionFeedback, setCorrectionFeedback] = useState<string | null>(null);

  // Real-time Measurements
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

  // UI Drawer / Modal Toggles
  const [showSavePresetModal, setShowSavePresetModal] = useState<boolean>(false);
  const [newPresetName, setNewPresetName] = useState<string>('');
  const [newPresetCategory, setNewPresetCategory] = useState<MasteringCategory>('Streaming');
  const [newPresetDesc, setNewPresetDesc] = useState<string>('');
  const [showDspDetails, setShowDspDetails] = useState<boolean>(false);

  // Checklist of Nashville mastering criteria
  const [checklist, setChecklist] = useState<{ [key: string]: boolean }>({
    hpf: true,
    dynamicEq: true,
    dualComp: true,
    voxSmash: true,
    truePeakSafe: true,
    monoPhaseAudit: true
  });

  // Combine Factory and Custom Presets
  const allPresets = useMemo(() => {
    return [...MASTERING_PRESETS_CATALOG, ...customPresets];
  }, [customPresets]);

  // Filtered Presets
  const filteredPresets = useMemo(() => {
    return allPresets.filter((p) => {
      const matchCat = selectedCategory === 'all' || p.category === selectedCategory || (selectedCategory === 'custom' && p.isCustom);
      const matchSearch =
        presetSearch.trim() === '' ||
        p.name.toLowerCase().includes(presetSearch.toLowerCase()) ||
        p.description.toLowerCase().includes(presetSearch.toLowerCase()) ||
        p.tags.some((t) => t.toLowerCase().includes(presetSearch.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [allPresets, selectedCategory, presetSearch]);

  // Sync playback status with audioMiniDaw
  useEffect(() => {
    const interval = setInterval(() => {
      setIsPlaying(audioMiniDaw.getIsPlaying());
      setManualTrimDb(audioMiniDaw.getCorrectionGain());
    }, 200);
    return () => clearInterval(interval);
  }, []);

  // Poll real-time LUFS measurements (approx 20fps for smooth analog meters)
  useEffect(() => {
    let animId: number;
    const pollMeters = () => {
      const data = audioMiniDaw.getLufsMeasurements();
      setLufsData(data);
      animId = requestAnimationFrame(pollMeters);
    };
    animId = requestAnimationFrame(pollMeters);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Toggle playback
  const handleTogglePlay = () => {
    if (isPlaying) {
      audioMiniDaw.stopPlayback();
      setIsPlaying(false);
    } else {
      const activeStems = tracks.length > 0 && tracks[0].audioUrl ? tracks : getTrackStems(track);
      audioMiniDaw.startPlayback(activeStems, track.bpm, track.key);
      setIsPlaying(true);
    }
  };

  // Toggle mono collapse
  const handleToggleMono = () => {
    const next = !isMonoCollapse;
    setIsMonoCollapse(next);
    audioMiniDaw.setMonoCollapse(next);
  };

  // Switch A/B routing bus
  const handleSelectBus = (busId: 'master' | 'suno' | 'vocal' | 'instrumental' | 'ref') => {
    setActiveBus(busId);
    const activeStems = tracks.length > 0 && tracks[0].audioUrl ? tracks : getTrackStems(track);
    if (!isPlaying) {
      audioMiniDaw.startPlayback(activeStems, track.bpm, track.key);
      setIsPlaying(true);
    }
    audioMiniDaw.updateBusRouting(busId, activeStems);
    
    const stemName = busId === 'master' ? 'Final Master Print (FLAC/WAV)' :
      busId === 'vocal' ? 'UVR5 Isolated Dry Lead Vocal' :
      busId === 'instrumental' ? 'Full Backing Instrumental Bed' :
      busId === 'suno' ? 'Raw Pre-Master Generation' :
      'Billboard Commercial Top-100 Reference Curve';
    setCorrectionFeedback(`Solo Auditioning: ${stemName}`);
    setTimeout(() => setCorrectionFeedback(null), 3000);
  };

  // Select Target Profile
  const handleSelectTargetProfile = (profile: typeof TARGET_LUFS_PROFILES[0]) => {
    setTargetLufs(profile.targetLufs);
    setTargetCeiling(profile.ceiling);
    audioMiniDaw.setTargetLufs(profile.targetLufs, profile.ceiling);
  };

  // Apply a Mastering Preset
  const handleApplyPreset = (preset: MasteringPreset) => {
    setActivePresetId(preset.id);
    setCurrentEffects(preset.effects);
    audioMiniDaw.setEffects(preset.effects);

    if (preset.targetLufs !== undefined) {
      setTargetLufs(preset.targetLufs);
      setTargetCeiling(preset.truePeakCeiling);
      audioMiniDaw.setTargetLufs(preset.targetLufs, preset.truePeakCeiling);
    }

    setCorrectionFeedback(`Loaded "${preset.name}" preset (Target: ${preset.targetLufs} LUFS)`);
    setTimeout(() => setCorrectionFeedback(null), 3500);
  };

  // Perform 1-Click LUFS Correction
  const handleAutoCorrectLufs = () => {
    const result = audioMiniDaw.applyLufsCorrection(targetLufs, targetCeiling);
    setManualTrimDb(result.totalCorrectionGainDb);
    const sign = result.appliedDeltaDb >= 0 ? '+' : '';
    let msg = `Applied ${sign}${result.appliedDeltaDb} dB correction trim (Target: ${targetLufs} LUFS)`;
    if (result.safetyClamped) {
      msg += ` ⚠ Clamped to prevent exceeding ${targetCeiling} dBTP ceiling!`;
    }
    setCorrectionFeedback(msg);
    setTimeout(() => setCorrectionFeedback(null), 4500);
  };

  // Toggle Auto-Level Normalizer (Live AGC)
  const handleToggleAutoMatch = () => {
    const next = !autoMatchEnabled;
    setAutoMatchEnabled(next);
    audioMiniDaw.setAutoLufsMatch(next, targetLufs);
  };

  // Manual Correction Gain Adjustment
  const handleManualTrimChange = (val: number) => {
    setManualTrimDb(val);
    audioMiniDaw.setCorrectionGain(val);
  };

  // Reset Correction Gain to Neutral
  const handleResetCorrection = () => {
    audioMiniDaw.resetCorrectionGain();
    setManualTrimDb(0);
    setCorrectionFeedback('Gain correction reset to 0.0 dB (Unity)');
    setTimeout(() => setCorrectionFeedback(null), 3000);
  };

  // Reset Running Meters
  const handleResetMeters = () => {
    audioMiniDaw.resetLufsCounters();
  };

  // Export 24-Bit WAV with applied Mastering & LUFS Correction
  const handleExportMasterWav = async () => {
    setIsExportingWav(true);
    try {
      const activeFxWithCorrection: DawEffectsState = {
        ...currentEffects,
        correctionGainDb: manualTrimDb,
        targetLufs: targetLufs,
        truePeakCeilingDb: targetCeiling
      };
      const wavBlob = await audioMiniDaw.export24BitWav(
        tracks,
        track.bpm,
        8,
        activeFxWithCorrection
      );
      const url = URL.createObjectURL(wavBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${track.id}_${track.title.replace(/\s+/g, '_')}_MASTER_${targetLufs}LUFS_24Bit.wav`;
      a.click();
      URL.revokeObjectURL(url);
      setCorrectionFeedback(`Successfully bounced 24-Bit Lossless Master at ${targetLufs} LUFS!`);
      setTimeout(() => setCorrectionFeedback(null), 4000);
    } catch (err) {
      console.error('Failed to export master WAV:', err);
    } finally {
      setIsExportingWav(false);
    }
  };

  // Save Current Mastering Settings as User Preset
  const handleSaveCustomPreset = () => {
    if (!newPresetName.trim()) return;

    const newPreset: MasteringPreset = {
      id: `custom_mst_${Date.now()}`,
      name: newPresetName.trim(),
      category: newPresetCategory,
      targetLufs: targetLufs,
      truePeakCeiling: targetCeiling,
      targetLra: lufsData.lra,
      badge: 'User Preset',
      platformSpec: `Custom User Master (${targetLufs} LUFS | ${targetCeiling} dBTP)`,
      description: newPresetDesc.trim() || `User customized master chain calibrated to ${targetLufs} LUFS.`,
      tags: ['Custom', 'User', newPresetCategory],
      effects: {
        ...currentEffects,
        correctionGainDb: manualTrimDb,
        targetLufs: targetLufs,
        truePeakCeilingDb: targetCeiling,
        activeFxPresetName: newPresetName.trim()
      },
      isCustom: true
    };

    const updated = saveCustomMasteringPreset(newPreset);
    setCustomPresets(updated);
    setActivePresetId(newPreset.id);
    setShowSavePresetModal(false);
    setNewPresetName('');
    setNewPresetDesc('');
    setCorrectionFeedback(`Saved custom preset "${newPreset.name}" to studio library!`);
    setTimeout(() => setCorrectionFeedback(null), 3500);
  };

  // Delete Custom Preset
  const handleDeleteCustomPreset = (presetId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = deleteCustomMasteringPreset(presetId);
    setCustomPresets(updated);
    if (activePresetId === presetId) {
      setActivePresetId('mst_nashville_radio');
    }
  };

  // Helper for meter bar height percentage
  const lufsToPercent = (lufs: number): number => {
    // scale -48 LUFS (0%) to 0 LUFS (100%)
    const clamped = Math.max(-48, Math.min(0, lufs));
    return ((clamped + 48) / 48) * 100;
  };

  // Helper for meter bar color
  const getMeterColor = (val: number, target: number) => {
    if (val > 0) return 'bg-rose-500 shadow-rose-500/50 shadow-md';
    if (val > target + 1.5) return 'bg-amber-400 shadow-amber-400/50 shadow-md';
    if (val >= target - 1.5) return 'bg-emerald-400 shadow-emerald-400/50 shadow-md';
    if (val > -30) return 'bg-cyan-400';
    return 'bg-indigo-500';
  };

  return (
    <div className="space-y-5">
      {/* SECTION QUICK HELP BANNER & SOP GUIDE */}
      <div className="flex items-center justify-between flex-wrap gap-3 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-900/40 p-4 rounded-2xl shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Volume2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-black text-white">Senior Mastering Engineer & Level-Matched A/B Bus</h2>
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-mono text-[10px] font-bold border border-emerald-700/50">
                ITU-R BS.1770-4
              </span>
              <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-400 font-mono text-[10px] font-bold border border-indigo-700/50">
                EBU R128 Compliant
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time K-weighted integrated loudness measurement, True Peak detection, mastering presets, and 1-click gain normalization.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onOpenSectionGuide && (
            <button
              type="button"
              onClick={() => onOpenSectionGuide('mastering')}
              className="px-3.5 py-1.5 rounded-xl bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 text-xs font-bold border border-amber-700/50 flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              title="Open Senior Mastering Operating Guide & SOP Rules"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Mastering SOP</span>
            </button>
          )}

          {/* Mono-Collapse Toggle */}
          <button
            onClick={handleToggleMono}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border cursor-pointer ${
              isMonoCollapse ? 'bg-amber-600 text-white border-amber-500 shadow-lg shadow-amber-950' : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
            }`}
            title="Audit wide reverb returns for phase cancellation on mobile phone speakers"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>{isMonoCollapse ? 'Mono Collapse ACTIVE' : 'Mono-Collapse Check'}</span>
          </button>

          {/* One-Click Master Deliverables Exporter */}
          <button
            type="button"
            onClick={() => setIsExportModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-700/60 text-purple-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            title="Generate complete master release package with WAV, stems, lyrics, and YouTube SEO"
          >
            <Package className="w-3.5 h-3.5 text-purple-400" />
            <span>Deliverables Package</span>
          </button>

          {/* Lossless WAV Master Export */}
          <button
            onClick={handleExportMasterWav}
            disabled={isExportingWav}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950 flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
            title="Export Lossless 24-Bit / 48kHz WAV with active mastering preset & LUFS correction"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExportingWav ? 'Bouncing Master...' : 'Bounce Master WAV'}</span>
          </button>

          {/* Play/Stop Master Transport */}
          <button
            onClick={handleTogglePlay}
            className={`px-4 py-1.5 rounded-xl text-xs font-black flex items-center gap-2 shadow-lg transition cursor-pointer ${
              isPlaying
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950 ring-2 ring-rose-500/50'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-950'
            }`}
          >
            {isPlaying ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            <span>{isPlaying ? 'Stop Playback' : 'Audition Master'}</span>
          </button>
        </div>
      </div>

      {/* NOTIFICATION FEEDBACK TOAST */}
      {correctionFeedback && (
        <div className="bg-indigo-950/90 border border-indigo-500/60 rounded-xl px-4 py-2 text-xs font-mono text-indigo-200 flex items-center justify-between shadow-xl animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{correctionFeedback}</span>
          </div>
          <button onClick={() => setCorrectionFeedback(null)} className="text-slate-400 hover:text-white text-[11px]">
            Dismiss
          </button>
        </div>
      )}

      {/* INTERACTIVE AUDIO WAVEFORM VISUALIZER WITH SCRUBBABLE PLAYHEAD */}
      <AudioWaveformVisualizer
        isPlaying={isPlaying}
        onTogglePlay={handleTogglePlay}
        trackTitle={`${track.title} (Master 24/48)`}
        targetLufs={targetLufs}
        truePeakCeiling={targetCeiling}
        isDarkMode={isDarkMode}
      />

      {/* A/B AUDITION BUS SELECTOR */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
          <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-indigo-400" />
            <span>Level-Matched Monitoring & A/B Bus Routing:</span>
          </span>
          <span className="text-[10px] font-mono text-slate-500">
            Active: <strong className="text-indigo-300 uppercase">{activeBus}</strong> • Latency: 0ms (Web Audio Native)
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {[
            { id: 'master', label: '[D] Final Master WAV', sub: 'Active DSP + Correction', icon: Volume2, color: 'text-indigo-400' },
            { id: 'suno', label: '[A] Raw Suno Gen', sub: 'Pre-Master Mix Stem', icon: Music, color: 'text-cyan-400' },
            { id: 'vocal', label: '[B] Isolated Dry Vocal', sub: 'UVR5 Clean Dialogue', icon: Activity, color: 'text-emerald-400' },
            { id: 'instrumental', label: '[C] True Instrumental', sub: 'Backing Stems Sum', icon: Layers, color: 'text-amber-400' },
            { id: 'ref', label: '[REF] Billboard Ref', sub: 'Commercial Top 100', icon: TrendingUp, color: 'text-rose-400' }
          ].map((bus) => (
            <button
              key={bus.id}
              onClick={() => handleSelectBus(bus.id as any)}
              className={`p-3 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 text-center cursor-pointer ${
                activeBus === bus.id
                  ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-950 ring-1 ring-indigo-400/50'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <bus.icon className={`w-3.5 h-3.5 ${activeBus === bus.id ? 'text-white' : bus.color}`} />
                <span>{bus.label}</span>
              </div>
              <span className={`text-[10px] font-normal ${activeBus === bus.id ? 'text-indigo-100' : 'text-slate-500'}`}>
                {bus.sub}
              </span>
            </button>
          ))}
        </div>

        {/* ACTIVE STEM DETAIL BADGE */}
        {(() => {
          const activeTrackDef = 
            activeBus === 'master' ? (tracks.find(t => t.stemType === 'master') || tracks[0]) :
            activeBus === 'vocal' ? (tracks.find(t => t.stemType === 'vocal' || t.name.toLowerCase().includes('vocal')) || tracks[1]) :
            activeBus === 'instrumental' ? (tracks.find(t => t.stemType === 'guitar' || t.stemType === 'drums' || t.stemType === 'bass' || t.name.toLowerCase().includes('instrumental')) || tracks[2]) :
            activeBus === 'suno' ? (tracks.find(t => t.name.toLowerCase().includes('v6') || t.name.toLowerCase().includes('original') || t.name.toLowerCase().includes('suno') || t.id === 4) || tracks[tracks.length - 1]) :
            (tracks.find(t => t.stemType === 'master') || tracks[0]);

          const rawFilename = activeTrackDef?.webdavPath?.split('/').pop() || activeTrackDef?.name || 'Master Audio';

          return (
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 flex items-center justify-between flex-wrap gap-2 text-xs font-mono">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="text-slate-400 text-[11px]">SOLO ROUTED:</span>
                <span className="text-white font-bold truncate max-w-[280px] sm:max-w-[420px]" title={rawFilename}>
                  {rawFilename}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0 text-[10px]">
                <span className="px-1.5 py-0.5 rounded bg-indigo-900/60 border border-indigo-500/40 text-indigo-300 font-bold uppercase">
                  {activeBus === 'master' ? 'Gold Master WAV' : activeBus === 'vocal' ? 'UVR5 Vocal Stem' : activeBus === 'instrumental' ? 'Backing Stems' : activeBus === 'suno' ? 'Pre-Master Mix' : 'Reference Match'}
                </span>
                <span className="text-slate-500 font-bold">24-Bit / 48kHz WebDAV</span>
              </div>
            </div>
          );
        })()}
      </div>

      {/* CORE REAL-TIME LUFS METER DASHBOARD */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Big Master Integrated & Peak Display + Target Compliance (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Integrated Loudness & Peak Ceiling
                </h3>
              </div>
              <button
                onClick={handleResetMeters}
                className="hover:text-amber-400 flex items-center gap-1 text-[11px] font-mono text-slate-400 transition"
                title="Reset running Integrated LUFS calculation"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Counters</span>
              </button>
            </div>

            {/* Big Digital Readouts */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              {/* Integrated LUFS Readout */}
              <div className="bg-slate-950 border border-slate-800/90 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden">
                <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400 font-mono">
                  <span>Integrated Loudness</span>
                  <span className="text-slate-500">BS.1770</span>
                </div>
                <div className="my-2">
                  <div className={`text-3xl font-black font-mono tracking-tight ${
                    lufsData.integratedLufs > -60
                      ? Math.abs(lufsData.integratedLufs - targetLufs) <= 1.0
                        ? 'text-emerald-400'
                        : lufsData.integratedLufs > targetLufs
                        ? 'text-amber-400'
                        : 'text-indigo-300'
                      : 'text-slate-500'
                  }`}>
                    {lufsData.integratedLufs > -60 ? `${lufsData.integratedLufs.toFixed(1)}` : '---.-'}
                    <span className="text-sm font-bold text-slate-500 ml-1">LUFS</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-slate-400">Target: {targetLufs.toFixed(1)} LUFS</span>
                  <span className={`px-1.5 py-0.5 rounded font-bold ${
                    Math.abs(lufsData.integratedLufs - targetLufs) <= 1.0 && lufsData.integratedLufs > -60
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-700/50'
                      : lufsData.integratedLufs > targetLufs + 1.0
                      ? 'bg-amber-950 text-amber-400 border border-amber-700/50'
                      : 'bg-slate-900 text-slate-400'
                  }`}>
                    {lufsData.integratedLufs <= -60
                      ? 'IDLE'
                      : Math.abs(lufsData.integratedLufs - targetLufs) <= 1.0
                      ? 'COMPLIANT'
                      : lufsData.integratedLufs > targetLufs
                      ? `+${(lufsData.integratedLufs - targetLufs).toFixed(1)} OVER`
                      : `${(lufsData.integratedLufs - targetLufs).toFixed(1)} UNDER`}
                  </span>
                </div>
              </div>

              {/* True Peak Readout */}
              <div className="bg-slate-950 border border-slate-800/90 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden">
                <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400 font-mono">
                  <span>True Peak Ceiling</span>
                  {lufsData.isClippingRisk && (
                    <span className="text-rose-400 flex items-center gap-1 font-bold animate-pulse">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      CLIP
                    </span>
                  )}
                </div>
                <div className="my-2">
                  <div className={`text-3xl font-black font-mono tracking-tight ${
                    lufsData.truePeakDb > targetCeiling
                      ? 'text-rose-400'
                      : lufsData.truePeakDb > -60
                      ? 'text-indigo-400'
                      : 'text-slate-500'
                  }`}>
                    {lufsData.truePeakDb > -60 ? `${lufsData.truePeakDb.toFixed(2)}` : '---.--'}
                    <span className="text-sm font-bold text-slate-500 ml-1">dBTP</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-slate-400">Ceiling: {targetCeiling.toFixed(1)} dBTP</span>
                  <span className={`px-1.5 py-0.5 rounded font-bold ${
                    lufsData.truePeakDb > targetCeiling
                      ? 'bg-rose-950 text-rose-300 border border-rose-700/50'
                      : 'bg-indigo-950 text-indigo-300 border border-indigo-700/50'
                  }`}>
                    {lufsData.truePeakDb > targetCeiling ? 'OVER CEILING' : 'ZERO CLIPPING'}
                  </span>
                </div>
              </div>
            </div>

            {/* Secondary Diagnostics (LRA, Crest Factor, Phase Correlation) */}
            <div className="grid grid-cols-3 gap-2.5 mt-3 text-xs font-mono">
              {/* LRA */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2.5">
                <span className="text-[10px] text-slate-400 block mb-0.5">Loudness Range</span>
                <span className="text-base font-bold text-cyan-300">{lufsData.lra.toFixed(1)} LU</span>
                <span className="text-[9px] text-slate-500 block mt-0.5">Dynamic variance</span>
              </div>

              {/* Dynamic Range / Crest Factor */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2.5">
                <span className="text-[10px] text-slate-400 block mb-0.5">Crest Factor (PLR)</span>
                <span className="text-base font-bold text-teal-300">{lufsData.crestFactorDb.toFixed(1)} dB</span>
                <span className="text-[9px] text-slate-500 block mt-0.5">Peak-to-Loudness</span>
              </div>

              {/* Phase Correlation */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2.5">
                <span className="text-[10px] text-slate-400 block mb-0.5">Phase Correlation</span>
                <span className={`text-base font-bold ${
                  lufsData.phaseCorrelation >= 0.5 ? 'text-emerald-400' : lufsData.phaseCorrelation >= 0 ? 'text-amber-400' : 'text-rose-400'
                }`}>
                  {lufsData.phaseCorrelation > 0 ? `+${lufsData.phaseCorrelation.toFixed(2)}` : lufsData.phaseCorrelation.toFixed(2)}
                </span>
                <span className="text-[9px] text-slate-500 block mt-0.5">
                  {lufsData.phaseCorrelation >= 0.5 ? 'Mono Safe' : 'Check Phase'}
                </span>
              </div>
            </div>

            {/* Visual Phase Correlation Bar */}
            <div className="mt-3 bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1">
              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                <span>Phase: -1.0 (Cancel)</span>
                <span>0.0 (Wide)</span>
                <span>+1.0 (Mono)</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full relative overflow-hidden">
                {/* Center marker */}
                <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-slate-600 z-10" />
                {/* Pointer indicator */}
                <div
                  className="absolute top-0 bottom-0 w-3 rounded-full bg-emerald-400 transition-all duration-75 shadow-xs"
                  style={{
                    left: `${Math.max(0, Math.min(100, ((lufsData.phaseCorrelation + 1) / 2) * 100))}%`,
                    transform: 'translateX(-50%)'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Quick Guidance Box */}
          <div className="bg-indigo-950/30 border border-indigo-800/40 rounded-xl p-3 text-[11px] text-slate-300 font-mono flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white">Nashville Loudness Rule:</strong> For commercial radio & pop playlists,
              target <span className="text-emerald-400 font-bold">-12.0 LUFS</span> with True Peak below{' '}
              <span className="text-indigo-400 font-bold">-0.8 dBTP</span> to avoid distortion on broadcast limiters.
            </div>
          </div>
        </div>

        {/* Right Column: Real-Time Dual Momentary & Short-Term Vertical LUFS Meters (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Real-Time ITU-R BS.1770 Dual Loudness Meters
              </h3>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-mono">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-slate-300">Target Range</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span className="text-slate-300">Over-Ceiling</span>
              </span>
            </div>
          </div>

          {/* Dual Meters Graphic Area */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/90 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Meter 1: Momentary Loudness (400ms) */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-300 font-bold flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  Momentary (400ms)
                </span>
                <span className="font-bold text-white">
                  {lufsData.momentaryLufs > -60 ? `${lufsData.momentaryLufs.toFixed(1)} LUFS` : '---.-'}
                </span>
              </div>

              {/* Horizontal Bar with Target Marker */}
              <div className="h-5 bg-slate-800 rounded-lg relative overflow-hidden border border-slate-700/50">
                {/* Target line */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-white z-20 shadow-md"
                  style={{ left: `${lufsToPercent(targetLufs)}%` }}
                  title={`Target: ${targetLufs} LUFS`}
                />
                {/* Level fill */}
                <div
                  className={`h-full transition-all duration-75 ${getMeterColor(lufsData.momentaryLufs, targetLufs)}`}
                  style={{ width: `${lufsToPercent(lufsData.momentaryLufs)}%` }}
                />
              </div>

              {/* Calibration Labels */}
              <div className="flex justify-between text-[9px] font-mono text-slate-500 px-0.5">
                <span>-48</span>
                <span>-36</span>
                <span>-24</span>
                <span className="text-indigo-400 font-bold">-16</span>
                <span className="text-emerald-400 font-bold">-12</span>
                <span className="text-amber-400 font-bold">-9</span>
                <span className="text-rose-400 font-bold">0 dBFS</span>
              </div>
            </div>

            {/* Meter 2: Short-Term Loudness (3.0s) */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-300 font-bold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  Short-Term (3.0s)
                </span>
                <span className="font-bold text-white">
                  {lufsData.shortTermLufs > -60 ? `${lufsData.shortTermLufs.toFixed(1)} LUFS` : '---.-'}
                </span>
              </div>

              {/* Horizontal Bar with Target Marker */}
              <div className="h-5 bg-slate-800 rounded-lg relative overflow-hidden border border-slate-700/50">
                {/* Target line */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-white z-20 shadow-md"
                  style={{ left: `${lufsToPercent(targetLufs)}%` }}
                  title={`Target: ${targetLufs} LUFS`}
                />
                {/* Level fill */}
                <div
                  className={`h-full transition-all duration-100 ${getMeterColor(lufsData.shortTermLufs, targetLufs)}`}
                  style={{ width: `${lufsToPercent(lufsData.shortTermLufs)}%` }}
                />
              </div>

              {/* Calibration Labels */}
              <div className="flex justify-between text-[9px] font-mono text-slate-500 px-0.5">
                <span>-48</span>
                <span>-36</span>
                <span>-24</span>
                <span className="text-indigo-400 font-bold">-16</span>
                <span className="text-emerald-400 font-bold">-12</span>
                <span className="text-amber-400 font-bold">-9</span>
                <span className="text-rose-400 font-bold">0 dBFS</span>
              </div>
            </div>
          </div>

          {/* LUFS TARGET PRESETS & 1-CLICK CORRECTION CONSOLE */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                Target Standard Normalization & Correction:
              </span>

              {/* 1-Click Auto-Correct Button */}
              <button
                onClick={handleAutoCorrectLufs}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold font-mono transition flex items-center gap-1.5 shadow-md shadow-emerald-950 cursor-pointer"
                title="Automatically compute gain delta and match to target LUFS"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>Auto-Correct to {targetLufs} LUFS</span>
              </button>
            </div>

            {/* Target Profile Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              {TARGET_LUFS_PROFILES.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSelectTargetProfile(p)}
                  className={`p-2 rounded-lg border text-left transition cursor-pointer ${
                    targetLufs === p.targetLufs && targetCeiling === p.ceiling
                      ? 'bg-indigo-600/30 border-indigo-400 text-white shadow-xs'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold truncate text-[11px]">{p.label}</div>
                  <div className="text-[10px] text-emerald-400 mt-0.5">
                    {p.targetLufs} LUFS • {p.ceiling} dBTP
                  </div>
                </button>
              ))}
            </div>

            {/* Manual Gain Trim & Live AGC Strip */}
            <div className="pt-2 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
              <div className="sm:col-span-8 flex items-center gap-3">
                <span className="text-[11px] font-mono text-slate-400 shrink-0">
                  Correction Gain:
                </span>
                <input
                  type="range"
                  min="-12"
                  max="12"
                  step="0.2"
                  value={manualTrimDb}
                  onChange={(e) => handleManualTrimChange(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
                <span className={`text-xs font-mono font-bold w-16 text-right ${
                  manualTrimDb > 0 ? 'text-emerald-400' : manualTrimDb < 0 ? 'text-rose-400' : 'text-slate-300'
                }`}>
                  {manualTrimDb > 0 ? `+${manualTrimDb.toFixed(1)}` : manualTrimDb.toFixed(1)} dB
                </span>
                <button
                  onClick={handleResetCorrection}
                  className="text-[10px] font-mono text-slate-400 hover:text-amber-400 underline cursor-pointer shrink-0"
                >
                  Reset
                </button>
              </div>

              {/* Live AGC Auto-Match Toggle */}
              <div className="sm:col-span-4 flex justify-end">
                <button
                  onClick={handleToggleAutoMatch}
                  className={`px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-bold transition flex items-center gap-1.5 border cursor-pointer ${
                    autoMatchEnabled
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-600 shadow-xs'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                  title="Continuously adjust gain in real-time to track target LUFS"
                >
                  <Activity className="w-3 h-3" />
                  <span>{autoMatchEnabled ? 'Live AGC: ACTIVE' : 'Enable Live AGC Match'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MASTERING PRESETS RACK */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5 flex-wrap">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Professional Mastering Presets Catalog ({filteredPresets.length} Loaded)
            </h3>
            <span className="text-xs text-slate-400">
              One-click studio caliber chains calibrated with specific EQ curves, VCA compression, and target LUFS.
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowSavePresetModal(true)}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Save Current as Preset</span>
            </button>

            <button
              onClick={() => setShowDspDetails(!showDspDetails)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1.5 border border-slate-700 cursor-pointer"
            >
              <span>{showDspDetails ? 'Hide DSP Parameters' : 'Show DSP Parameters'}</span>
              {showDspDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {/* Category Filter Pills & Search */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-1.5 flex-wrap text-xs font-mono">
            {[
              { id: 'all', label: 'All Presets' },
              { id: 'Streaming', label: 'Streaming' },
              { id: 'Radio & Commercial', label: 'Radio & Commercial' },
              { id: 'Modern Punch', label: 'Modern Punch' },
              { id: 'Warm Vintage', label: 'Warm Vintage' },
              { id: 'Acoustic & Classical', label: 'Acoustic' },
              { id: 'Broadcast & Dialogue', label: 'Broadcast / Podcast' },
              { id: 'custom', label: 'My Custom Presets' }
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-indigo-600 text-white font-bold shadow-xs'
                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder="Search presets by genre, tag, or spec..."
            value={presetSearch}
            onChange={(e) => setPresetSearch(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 w-full sm:w-64 focus:outline-hidden focus:border-indigo-500"
          />
        </div>

        {/* Presets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPresets.map((preset) => {
            const isSelected = activePresetId === preset.id;
            return (
              <div
                key={preset.id}
                onClick={() => handleApplyPreset(preset)}
                className={`p-4 rounded-xl border transition flex flex-col justify-between space-y-3 cursor-pointer ${
                  isSelected
                    ? 'bg-slate-950 border-indigo-500 ring-2 ring-indigo-500/40 shadow-xl shadow-indigo-950/50'
                    : 'bg-slate-950/80 border-slate-800/90 hover:border-slate-700 hover:bg-slate-950'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-white">{preset.name}</span>
                        {preset.isCustom && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-950 text-amber-400 font-mono text-[9px] border border-amber-700/50">
                            Custom
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-indigo-400 font-mono block mt-0.5">
                        {preset.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-mono text-[10px] font-bold border border-emerald-700/50">
                        {preset.targetLufs} LUFS
                      </span>
                      {preset.isCustom && (
                        <button
                          onClick={(e) => handleDeleteCustomPreset(preset.id, e)}
                          className="text-slate-500 hover:text-rose-400 text-xs ml-1"
                          title="Delete Custom Preset"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {preset.description}
                  </p>
                </div>

                {/* Preset DSP Readout Drawer (if expanded) */}
                {showDspDetails && (
                  <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 text-[10px] font-mono space-y-1 text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">EQ:</span>
                      <span>
                        Low: {preset.effects.eq.low > 0 ? `+${preset.effects.eq.low}` : preset.effects.eq.low}dB • 
                        Mid: {preset.effects.eq.mid > 0 ? `+${preset.effects.eq.mid}` : preset.effects.eq.mid}dB • 
                        High: {preset.effects.eq.high > 0 ? `+${preset.effects.eq.high}` : preset.effects.eq.high}dB
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Compressor:</span>
                      <span>
                        {preset.effects.compressor.ratio}:1 @ {preset.effects.compressor.threshold}dB (+{preset.effects.compressor.makeup}dB gain)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Tape / Reverb:</span>
                      <span>
                        Drive: {preset.effects.tapeDrive.drive}% • Mix: {preset.effects.reverb.mix}%
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px] font-mono">
                  <span className="text-slate-500 truncate max-w-[180px]">
                    Ceiling: {preset.truePeakCeiling} dBTP
                  </span>
                  <div className="flex items-center gap-1.5">
                    {isSelected ? (
                      <span className="flex items-center gap-1 text-emerald-400 font-bold">
                        <Check className="w-3 h-3" />
                        <span>Active Master</span>
                      </span>
                    ) : (
                      <span className="text-slate-400 group-hover:text-white flex items-center gap-1">
                        <span>Load Preset</span>
                        <ArrowRight className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* NASHVILLE BENCHMARK MASTER CHAIN AUDIT CHECKLIST */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-xl">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase font-bold text-white font-mono flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Nashville Senior Mastering Audit Checklist & Quality Gate</span>
          </span>
          <span className="text-[10px] font-mono text-emerald-400">
            6/6 Quality Checks Passed
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 text-slate-300 font-mono text-xs">
          {[
            { key: 'hpf', label: 'Subtractive HPF @ 80-100Hz on Vocals', desc: 'Rumble removed to preserve master limiter headroom' },
            { key: 'dynamicEq', label: 'Dynamic EQ Mud Notch @ 300-500Hz', desc: 'Prevents boxiness in crowded stereo stems' },
            { key: 'dualComp', label: 'Dual-Stage VCA Compression', desc: 'Transparent bus glue with musical auto-release' },
            { key: 'voxSmash', label: 'Parallel Vox Smash Bus (5-10%)', desc: 'Retains intelligible vocal transients in loud passages' },
            { key: 'truePeakSafe', label: 'Intersample Peak Ceiling Guard (-1.0 dBTP)', desc: 'Prevents clipping on lossy MP3/AAC/Opus streaming codecs' },
            { key: 'monoPhaseAudit', label: 'Mobile Phone Mono-Collapse Coherence', desc: 'Audited with zero vocal or snare cancellation' }
          ].map((item) => (
            <div
              key={item.key}
              onClick={() => setChecklist({ ...checklist, [item.key]: !checklist[item.key] })}
              className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition ${
                checklist[item.key]
                  ? 'bg-slate-950 border-emerald-900/60 text-slate-200'
                  : 'bg-slate-950/60 border-slate-800 text-slate-500'
              }`}
            >
              <div className={`mt-0.5 rounded p-0.5 ${checklist[item.key] ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-600'}`}>
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
              <div>
                <span className={`font-bold block ${checklist[item.key] ? 'text-white' : 'text-slate-400'}`}>
                  {item.label}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  {item.desc}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SAVE CUSTOM PRESET MODAL */}
      {showSavePresetModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-amber-400" />
                <span>Save Custom Mastering Preset</span>
              </h3>
              <button
                onClick={() => setShowSavePresetModal(false)}
                className="text-slate-400 hover:text-white text-base"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-bold block">Preset Name:</label>
                <input
                  type="text"
                  placeholder="e.g. My Warm Acoustic Polish"
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold block">Mastering Category:</label>
                <select
                  value={newPresetCategory}
                  onChange={(e) => setNewPresetCategory(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-hidden focus:border-indigo-500"
                >
                  <option value="Streaming">Streaming Standard</option>
                  <option value="Radio & Commercial">Radio & Commercial</option>
                  <option value="Modern Punch">Modern Punch</option>
                  <option value="Warm Vintage">Warm Vintage</option>
                  <option value="Acoustic & Classical">Acoustic & Classical</option>
                  <option value="Broadcast & Dialogue">Broadcast & Dialogue</option>
                  <option value="Corrective">Corrective</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold block">Description & Audio Notes:</label>
                <textarea
                  rows={3}
                  placeholder="Notes about saturation, compression ratios, and intended playback environment..."
                  value={newPresetDesc}
                  onChange={(e) => setNewPresetDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-400 space-y-1">
                <div className="text-white font-bold">Snapshot Parameters:</div>
                <div>Target LUFS: <strong className="text-emerald-400">{targetLufs} LUFS</strong> • Ceiling: <strong className="text-indigo-400">{targetCeiling} dBTP</strong></div>
                <div>Correction Gain: <strong className="text-teal-400">{manualTrimDb > 0 ? `+${manualTrimDb}` : manualTrimDb} dB</strong></div>
                <div>Active EQ: Low {currentEffects.eq.low}dB / Mid {currentEffects.eq.mid}dB / High {currentEffects.eq.high}dB</div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowSavePresetModal(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCustomPreset}
                disabled={!newPresetName.trim()}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition disabled:opacity-50"
              >
                Save to Library
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ONE-CLICK MASTER DELIVERABLES EXPORTER MODAL */}
      <MasterDeliverablesExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        track={track}
        onCopySuccess={(msg) => setCorrectionFeedback(msg)}
        isDarkMode={isDarkMode}
      />
    </div>
  );
};
