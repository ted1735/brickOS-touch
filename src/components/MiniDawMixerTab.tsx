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
  RefreshCw,
  GripVertical,
  FolderKanban,
  Loader2,
  Users,
  Link2,
  Link2Off,
  Plus,
  Trash2,
  Settings2,
  X
} from 'lucide-react';
import { Track, MixerTrack, DawEffectsState, LufsMeasurementData, TrackAutomationState, MixerGroup } from '../types';
import { audioMiniDaw } from '../utils/audioEngine';
import { SectionQuickHelpBanner } from './SectionQuickHelpBanner';
import { MiniDawRealtimeChart } from './MiniDawRealtimeChart';
import { MiniDawSpectrumVisualizer } from './MiniDawSpectrumVisualizer';
import { MasteringRack } from './MasteringRack';
import { MiniDawProjectBrowserSidebar } from './MiniDawProjectBrowserSidebar';
import { AutomationLaneEditor, interpolateAutomationValue } from './AutomationLaneEditor';
import { DEFAULT_DAW_EFFECTS, DAW_FX_PRESET_LIBRARY, INITIAL_DAW_STEMS } from '../data/dawEffectsPresets';
import { getTrackStems as getUniversalTrackStems } from '../data/nextcloudAssetIndex';
import { CANONICAL_TRACKS } from '../data/canonicalCatalog';
import { buildNextcloudStreamUrl } from '../utils/nextcloudStream';

interface MiniDawMixerTabProps {
  track: Track;
  onOpenSectionGuide?: (sectionId?: any) => void;
  isDarkMode?: boolean;
  onSelectTrack?: (track: Track) => void;
  allTracks?: Track[];
}

const DEFAULT_MIXER_GROUPS: MixerGroup[] = [
  { id: 'grp-vocal', name: 'Group A • Vocals', color: '#8B5CF6' },
  { id: 'grp-music', name: 'Group B • Rhythm & Bed', color: '#06B6D4' },
  { id: 'grp-lead',  name: 'Group C • Leads & Solo', color: '#F59E0B' },
  { id: 'grp-aux',   name: 'Group D • FX & Ambience', color: '#10B981' }
];

const GROUP_PALETTE = [
  { name: 'Purple', hex: '#8B5CF6' },
  { name: 'Cyan', hex: '#06B6D4' },
  { name: 'Amber', hex: '#F59E0B' },
  { name: 'Emerald', hex: '#10B981' },
  { name: 'Rose', hex: '#F43F5E' },
  { name: 'Blue', hex: '#3B82F6' },
  { name: 'Orange', hex: '#F97316' },
  { name: 'Indigo', hex: '#6366F1' }
];

const assignDefaultGroupsToStems = (stems: MixerTrack[]): MixerTrack[] => {
  return stems.map((s, idx) => {
    if (s.groupId !== undefined) return s;
    const nameLower = (s.name || '').toLowerCase();
    const stemType = s.stemType || '';
    if (
      stemType === 'vocal' ||
      stemType === 'choir' ||
      nameLower.includes('vocal') ||
      nameLower.includes('choir') ||
      nameLower.includes('lead') ||
      idx === 0 ||
      idx === 1
    ) {
      return { ...s, groupId: 'grp-vocal' };
    }
    return { ...s, groupId: 'grp-music' };
  });
};

const getTrackStems = (track: Track): MixerTrack[] => {
  return assignDefaultGroupsToStems(getUniversalTrackStems(track));
};

export const MiniDawMixerTab: React.FC<MiniDawMixerTabProps> = ({
  track,
  onOpenSectionGuide,
  isDarkMode = true,
  onSelectTrack,
  allTracks = CANONICAL_TRACKS
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [masterVolume, setMasterVolume] = useState(85);
  const [isMasterMuted, setIsMasterMuted] = useState(false);
  const [isMasterDimmed, setIsMasterDimmed] = useState(false);
  const [isMonoCollapsed, setIsMonoCollapsed] = useState(false);
  const [masterLevels, setMasterLevels] = useState<{ l: number; r: number }>({ l: 0, r: 0 });
  const [tracks, setTracks] = useState<MixerTrack[]>(() => getTrackStems(track));
  const [groups, setGroups] = useState<MixerGroup[]>(DEFAULT_MIXER_GROUPS);
  const [isGroupLinkingEnabled, setIsGroupLinkingEnabled] = useState<boolean>(true);
  const [activeGroupMenuTrackId, setActiveGroupMenuTrackId] = useState<number | null>(null);
  const [isCreatingGroup, setIsCreatingGroup] = useState<boolean>(false);
  const [newGroupName, setNewGroupName] = useState<string>('');
  const [newGroupColor, setNewGroupColor] = useState<string>('#8B5CF6');
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editGroupName, setEditGroupName] = useState<string>('');
  const [editGroupColor, setEditGroupColor] = useState<string>('#8B5CF6');
  const [isExportingWav, setIsExportingWav] = useState(false);
  const [cropPreset, setCropPreset] = useState<'30s' | '60s' | 'full'>('60s');
  const [isNextcloudSyncing, setIsNextcloudSyncing] = useState<boolean>(false);
  const [nextcloudSyncNotice, setNextcloudSyncNotice] = useState<string>('');
  const [isProjectBrowserOpen, setIsProjectBrowserOpen] = useState<boolean>(true);
  const [dragOverChannelId, setDragOverChannelId] = useState<number | null>(null);
  const [isLoadingAudio, setIsLoadingAudio] = useState<boolean>(false);
  const [isLinkingAsset, setIsLinkingAsset] = useState<boolean>(false);
  const [linkingAssetLabel, setLinkingAssetLabel] = useState<string>('');

  useEffect(() => {
    return audioMiniDaw.addLoadingListener(setIsLoadingAudio);
  }, []);

  useEffect(() => {
    setTracks(getTrackStems(track));
  }, [track.id]);

  // Assign any asset from Project Browser to a specific channel
  const handleAssignAssetToTrack = (channelId: number, asset: any) => {
    const webdavPath = asset.webdavPath || `/remote.php/dav/files/ncted/Music-Production/${asset.filename || asset.name}`;
    const audioUrl = buildNextcloudStreamUrl(webdavPath);
    const cleanName = (asset.filename || asset.name || `Stem ${channelId}`).replace(/\.[^/.]+$/, '');

    setIsLinkingAsset(true);
    setLinkingAssetLabel(`Linking "${cleanName}" to Channel ${channelId} from Nextcloud...`);

    setTracks(prev => prev.map(t => {
      if (t.id === channelId) {
        return {
          ...t,
          name: `Track ${channelId}: ${cleanName}`,
          webdavPath,
          audioUrl,
          isRealAudio: true,
          stemType: asset.stemType || (asset.category?.includes('VOCAL') ? 'vocal' : asset.category?.includes('DRUM') ? 'drums' : asset.category?.includes('BASS') ? 'bass' : 'organ'),
          color: asset.color || t.color
        };
      }
      return t;
    }));

    setNextcloudSyncNotice(`✓ Routed "${cleanName}" to Channel ${channelId}`);
    setTimeout(() => {
      setIsLinkingAsset(false);
      setLinkingAssetLabel('');
    }, 700);
    setTimeout(() => setNextcloudSyncNotice(''), 4000);

    if (isPlaying) {
      audioMiniDaw.stopPlayback();
      setTimeout(() => {
        audioMiniDaw.startPlayback(
          tracks.map(t => t.id === channelId ? { ...t, webdavPath, audioUrl, isRealAudio: true } : t),
          track.bpm,
          track.key
        );
      }, 80);
    }
  };

  // Load all 4 stems of any track into Mixer
  const handleLoadAllStems = (trackToLoad: Track) => {
    setIsLinkingAsset(true);
    setLinkingAssetLabel(`Fetching & linking all 4 stems for "${trackToLoad.title}" from Nextcloud...`);
    const stems = getUniversalTrackStems(trackToLoad);
    setTracks(stems);
    setNextcloudSyncNotice(`✓ Loaded all 4 stems for ${trackToLoad.title}`);
    setTimeout(() => {
      setIsLinkingAsset(false);
      setLinkingAssetLabel('');
    }, 800);
    setTimeout(() => setNextcloudSyncNotice(''), 4000);

    if (isPlaying) {
      audioMiniDaw.stopPlayback();
      setTimeout(() => {
        audioMiniDaw.startPlayback(stems, trackToLoad.bpm, trackToLoad.key);
      }, 80);
    }
  };

  // HTML5 Drag-and-Drop handler on channel strip
  const handleDropOnChannel = (channelId: number, e: React.DragEvent) => {
    e.preventDefault();
    setDragOverChannelId(null);
    try {
      const rawData = e.dataTransfer.getData('application/json');
      if (rawData) {
        const asset = JSON.parse(rawData);
        handleAssignAssetToTrack(channelId, asset);
        return;
      }
      const plainText = e.dataTransfer.getData('text/plain');
      if (plainText) {
        handleAssignAssetToTrack(channelId, { filename: plainText });
      }
    } catch (err) {
      console.warn('Failed to parse dropped asset data:', err);
    }
  };

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

  // Expandable Volume & Pan Automation Lanes State
  const [trackAutomation, setTrackAutomation] = useState<Record<number, TrackAutomationState>>(() => {
    const initial: Record<number, TrackAutomationState> = {};
    [1, 2, 3, 4].forEach((id) => {
      initial[id] = {
        isExpanded: false,
        activeParam: 'vol',
        volumeBypass: false,
        panBypass: false,
        volumeNodes: [
          { id: `v-${id}-0`, timePercent: 0, value: 80 },
          { id: `v-${id}-1`, timePercent: 100, value: 80 }
        ],
        panNodes: [
          { id: `p-${id}-0`, timePercent: 0, value: 0 },
          { id: `p-${id}-1`, timePercent: 100, value: 0 }
        ]
      };
    });
    return initial;
  });

  const [playbackProgressPercent, setPlaybackProgressPercent] = useState<number>(0);
  const [liveDynamicValues, setLiveDynamicValues] = useState<Record<number, { vol: number; pan: number }>>({});
  const playbackStartTimeRef = React.useRef<number | null>(null);

  const defaultAutomationForTrack = (trk: MixerTrack): TrackAutomationState => ({
    isExpanded: false,
    activeParam: 'vol',
    volumeBypass: false,
    panBypass: false,
    volumeNodes: [
      { id: `v-${trk.id}-0`, timePercent: 0, value: trk.vol },
      { id: `v-${trk.id}-1`, timePercent: 100, value: trk.vol }
    ],
    panNodes: [
      { id: `p-${trk.id}-0`, timePercent: 0, value: trk.pan },
      { id: `p-${trk.id}-1`, timePercent: 100, value: trk.pan }
    ]
  });

  const handleToggleAutomationLane = (trackId: number) => {
    setTrackAutomation((prev) => {
      const cur = prev[trackId] || defaultAutomationForTrack(tracks.find((t) => t.id === trackId) || tracks[0]);
      return {
        ...prev,
        [trackId]: {
          ...cur,
          isExpanded: !cur.isExpanded
        }
      };
    });
  };

  const handleUpdateAutomation = (trackId: number, newState: TrackAutomationState) => {
    setTrackAutomation((prev) => ({
      ...prev,
      [trackId]: newState
    }));
  };

  useEffect(() => {
    if (!isPlaying) {
      setChannelLevels({});
      setMasterLevels({ l: 0, r: 0 });
      playbackStartTimeRef.current = null;
      setPlaybackProgressPercent(0);
      return;
    }

    if (!playbackStartTimeRef.current) {
      playbackStartTimeRef.current = Date.now();
    }

    let frameId: number;
    let tick = 0;
    const updateMeters = () => {
      tick++;
      const now = Date.now();
      const elapsedSec = ((now - (playbackStartTimeRef.current || now)) / 1000) % 60;
      const progressPercent = (elapsedSec / 60) * 100;
      setPlaybackProgressPercent(progressPercent);

      const anySolo = tracks.some((t) => t.solo);
      const levels: { [id: number]: { l: number; r: number } } = {};
      const dynamicVals: { [id: number]: { vol: number; pan: number } } = {};
      let sumL = 0;
      let sumR = 0;
      let audibleCount = 0;

      tracks.forEach((trk, idx) => {
        const auto = trackAutomation[trk.id];
        let effVol = trk.vol;
        let effPan = trk.pan;

        if (auto) {
          if (!auto.volumeBypass && auto.volumeNodes && auto.volumeNodes.length > 0) {
            effVol = Math.round(interpolateAutomationValue(auto.volumeNodes, progressPercent));
          }
          if (!auto.panBypass && auto.panNodes && auto.panNodes.length > 0) {
            effPan = Math.round(interpolateAutomationValue(auto.panNodes, progressPercent));
          }
        }
        dynamicVals[trk.id] = { vol: effVol, pan: effPan };

        // Dispatch real-time automation to Web Audio engine
        const hasSolo = tracks.some((t) => t.solo);
        audioMiniDaw.updateTrackControls(trk.id, effVol, effPan, trk.muted, hasSolo, trk.solo);

        const isAudible = !trk.muted && (!anySolo || trk.solo);
        if (!isAudible) {
          levels[trk.id] = { l: 0, r: 0 };
          return;
        }

        const baseAmp = (effVol / 100);
        const phaseOffset = idx * 1.35;
        const wave = 0.55 + 0.45 * Math.sin(tick * 0.15 + phaseOffset) * Math.cos(tick * 0.08);
        const flutter = (Math.random() * 0.16 - 0.08);
        const levelVal = Math.min(100, Math.max(0, Math.round(baseAmp * (wave + flutter) * 100)));
        
        const panRatio = effPan / 100;
        const leftLevel = Math.round(levelVal * (panRatio > 0 ? (1 - panRatio * 0.55) : 1));
        const rightLevel = Math.round(levelVal * (panRatio < 0 ? (1 + panRatio * 0.55) : 1));

        levels[trk.id] = { l: leftLevel, r: rightLevel };
        sumL += leftLevel;
        sumR += rightLevel;
        audibleCount++;
      });

      setChannelLevels(levels);
      setLiveDynamicValues(dynamicVals);

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
  }, [isPlaying, tracks, trackAutomation, masterVolume, isMasterMuted, isMasterDimmed, isMonoCollapsed]);

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
      audioMiniDaw.updateBusRouting(effects.busRouting || 'daw', tracks);
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

  // Synchronize audio engine for all tracks
  const syncAudioEngineTracks = (updatedTracks: MixerTrack[]) => {
    const hasSolo = updatedTracks.some((t) => t.solo);
    updatedTracks.forEach((t) => {
      audioMiniDaw.updateTrackControls(t.id, t.vol, t.pan, t.muted, hasSolo, t.solo);
    });
  };

  // Update track state
  const handleUpdateTrack = (id: number, field: keyof MixerTrack, val: any) => {
    const updated = tracks.map((t) => (t.id === id ? { ...t, [field]: val } : t));
    setTracks(updated);

    if (field === 'solo' || field === 'muted') {
      syncAudioEngineTracks(updated);
    } else {
      const targetTrack = updated.find((t) => t.id === id);
      if (targetTrack) {
        const hasSolo = updated.some((t) => t.solo);
        audioMiniDaw.updateTrackControls(id, targetTrack.vol, targetTrack.pan, targetTrack.muted, hasSolo, targetTrack.solo);
      }
    }
  };

  // Handle click on channel Mute button with group linking
  const handleTrackMuteClick = (trackId: number, e?: React.MouseEvent) => {
    const target = tracks.find((t) => t.id === trackId);
    if (!target) return;

    const isAlt = e && (e.altKey || e.metaKey);
    const shouldLink = isGroupLinkingEnabled && target.groupId && !isAlt;

    if (shouldLink) {
      const nextMuted = !target.muted;
      const updated = tracks.map((t) => {
        if (t.groupId === target.groupId) {
          return { ...t, muted: nextMuted };
        }
        return t;
      });
      setTracks(updated);
      syncAudioEngineTracks(updated);
    } else {
      handleUpdateTrack(trackId, 'muted', !target.muted);
    }
  };

  // Handle click on channel Solo button with group linking
  const handleTrackSoloClick = (trackId: number, e?: React.MouseEvent) => {
    const target = tracks.find((t) => t.id === trackId);
    if (!target) return;

    const isAlt = e && (e.altKey || e.metaKey);
    const shouldLink = isGroupLinkingEnabled && target.groupId && !isAlt;

    if (shouldLink) {
      const nextSolo = !target.solo;
      const updated = tracks.map((t) => {
        if (t.groupId === target.groupId) {
          return { ...t, solo: nextSolo };
        }
        return t;
      });
      setTracks(updated);
      syncAudioEngineTracks(updated);
    } else {
      handleUpdateTrack(trackId, 'solo', !target.solo);
    }
  };

  // Toggle Mute for an entire group
  const handleToggleGroupMute = (groupId: string) => {
    const memberTracks = tracks.filter((t) => t.groupId === groupId);
    if (memberTracks.length === 0) return;

    const allMuted = memberTracks.every((t) => t.muted);
    const nextMuted = !allMuted;

    const updated = tracks.map((t) => {
      if (t.groupId === groupId) {
        return { ...t, muted: nextMuted };
      }
      return t;
    });
    setTracks(updated);
    syncAudioEngineTracks(updated);
  };

  // Toggle Solo for an entire group
  const handleToggleGroupSolo = (groupId: string) => {
    const memberTracks = tracks.filter((t) => t.groupId === groupId);
    if (memberTracks.length === 0) return;

    const allSolo = memberTracks.every((t) => t.solo);
    const nextSolo = !allSolo;

    const updated = tracks.map((t) => {
      if (t.groupId === groupId) {
        return { ...t, solo: nextSolo };
      }
      return t;
    });
    setTracks(updated);
    syncAudioEngineTracks(updated);
  };

  // Clear all solos in the mixer
  const handleClearAllSolos = () => {
    const updated = tracks.map((t) => ({ ...t, solo: false }));
    setTracks(updated);
    syncAudioEngineTracks(updated);
  };

  // Unmute all tracks in the mixer
  const handleUnmuteAllTracks = () => {
    const updated = tracks.map((t) => ({ ...t, muted: false }));
    setTracks(updated);
    syncAudioEngineTracks(updated);
  };

  // Assign track to group
  const handleAssignTrackGroup = (trackId: number, groupId: string | null) => {
    const updated = tracks.map((t) => (t.id === trackId ? { ...t, groupId } : t));
    setTracks(updated);
    setActiveGroupMenuTrackId(null);
  };

  // Create custom group
  const handleCreateCustomGroup = () => {
    if (!newGroupName.trim()) return;
    const newId = `grp-${Date.now()}`;
    const newGroup: MixerGroup = {
      id: newId,
      name: newGroupName.trim(),
      color: newGroupColor
    };
    setGroups((prev) => [...prev, newGroup]);
    setNewGroupName('');
    setIsCreatingGroup(false);
  };

  // Delete custom group
  const handleDeleteGroup = (groupId: string) => {
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
    setTracks((prev) => prev.map((t) => (t.groupId === groupId ? { ...t, groupId: null } : t)));
    if (editingGroupId === groupId) setEditingGroupId(null);
  };

  // Save edited group
  const handleSaveEditGroup = (groupId: string) => {
    if (!editGroupName.trim()) return;
    setGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, name: editGroupName.trim(), color: editGroupColor } : g))
    );
    setEditingGroupId(null);
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

      {/* Responsive Horizontal Layout: Project Browser Sidebar + Mini-DAW Console */}
      <div className="flex flex-col xl:flex-row gap-5 items-start w-full">
        {/* WEBDAV PROJECT BROWSER SIDEBAR */}
        <MiniDawProjectBrowserSidebar
          selectedTrack={track}
          onSelectTrack={onSelectTrack}
          allTracks={allTracks || CANONICAL_TRACKS}
          onAssignAssetToTrack={handleAssignAssetToTrack}
          onLoadAllStems={handleLoadAllStems}
          isDarkMode={isDarkMode}
          isOpen={isProjectBrowserOpen}
          onToggleOpen={() => setIsProjectBrowserOpen(prev => !prev)}
        />

        {/* MAIN CONSOLE & CHANNELS */}
        <div className="flex-1 min-w-0 space-y-5 w-full">
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
                  Precision stem balancing for {track.title} ({track.bpm} BPM • {track.key}) with real-time 3-band EQ, compressor, and tape saturation. Drag & drop assets from the sidebar directly onto any track!
                </p>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                {/* Toggle Project Browser */}
                <button
                  type="button"
                  onClick={() => setIsProjectBrowserOpen(!isProjectBrowserOpen)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition cursor-pointer shadow-xs ${
                    isProjectBrowserOpen
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-700/60 shadow-cyan-950/40'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                  }`}
                  title="Toggle Nextcloud WebDAV Project Browser Sidebar"
                >
                  <FolderKanban className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{isProjectBrowserOpen ? 'Hide Browser' : 'Project Browser'}</span>
                </button>

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

            {/* Master Transport Play/Stop Button with Enhanced Glowing Styling */}
            <button
              onClick={handleTogglePlay}
              className={`px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2.5 transition-all duration-200 cursor-pointer shadow-xl border ${
                isPlaying
                  ? 'bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white border-rose-400/40 shadow-rose-950/80 ring-2 ring-rose-500/50 animate-pulse'
                  : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:via-purple-500 hover:to-indigo-500 text-white border-indigo-400/40 shadow-indigo-950/80 hover:shadow-indigo-600/30 hover:scale-[1.02] active:scale-[0.98]'
              }`}
              title={isPlaying ? 'Stop playback (Spacebar)' : 'Play 4-Track Lossless PCM Stream (Spacebar)'}
            >
              {isPlaying ? (
                isLoadingAudio ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                ) : (
                  <Square className="w-4 h-4 fill-current text-white" />
                )
              ) : (
                <Play className="w-4 h-4 fill-current text-amber-300" />
              )}
              <span className="tracking-wide">
                {isPlaying
                  ? isLoadingAudio
                    ? 'Loading Audio...'
                    : 'Stop 4-Track'
                  : 'Play 4-Track'}
              </span>
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
                    <option value="daw">All 4 Tracks Sum (Full Mix)</option>
                    <option value="master">Gold Master Print</option>
                    <option value="vocal">Dry Lead Vocal Stem</option>
                    <option value="instrumental">Backing Instrumental Bed</option>
                    <option value="suno">Raw Suno / Alternate Cut</option>
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

      {/* CUSTOM MUTE & SOLO GROUPS (VCA / LINK) TOOLBAR */}
      <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 space-y-3 font-mono shadow-md">
        {/* Header row */}
        <div className="flex items-center justify-between flex-wrap gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Mute & Solo Groups (VCA / Link)
                </h3>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-700/50">
                  {groups.length} Groups
                </span>
                <span className="text-[10px] text-slate-500 hidden sm:inline">
                  • Group tracks for simultaneous Mute/Solo during playback
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Group Link Switch */}
            <button
              type="button"
              onClick={() => setIsGroupLinkingEnabled(!isGroupLinkingEnabled)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1.5 border cursor-pointer ${
                isGroupLinkingEnabled
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600/50 hover:bg-emerald-900'
                  : 'bg-amber-950/80 text-amber-300 border-amber-600/50 hover:bg-amber-900'
              }`}
              title={
                isGroupLinkingEnabled
                  ? 'Channel M/S buttons synchronize across group members (Click to suspend)'
                  : 'Group linking suspended: channel M/S clicks only affect that single track (Click to activate)'
              }
            >
              {isGroupLinkingEnabled ? (
                <>
                  <Link2 className="w-3 h-3 text-emerald-400" />
                  <span>Link: ACTIVE</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </>
              ) : (
                <>
                  <Link2Off className="w-3 h-3 text-amber-400" />
                  <span>Link: SUSPENDED</span>
                </>
              )}
            </button>

            {/* Quick shortcuts */}
            {tracks.some((t) => t.solo) && (
              <button
                type="button"
                onClick={handleClearAllSolos}
                className="px-2 py-1 rounded-lg text-[10px] font-bold bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 transition flex items-center gap-1 cursor-pointer"
              >
                <span>Clear Solos</span>
              </button>
            )}

            {tracks.some((t) => t.muted) && (
              <button
                type="button"
                onClick={handleUnmuteAllTracks}
                className="px-2 py-1 rounded-lg text-[10px] font-bold bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/40 transition flex items-center gap-1 cursor-pointer"
              >
                <span>Unmute All</span>
              </button>
            )}

            {/* Add Custom Group button */}
            <button
              type="button"
              onClick={() => setIsCreatingGroup(true)}
              className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition flex items-center gap-1 shadow-sm cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>New Group</span>
            </button>
          </div>
        </div>

        {/* Modal / inline form to create new custom group */}
        {isCreatingGroup && (
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-200">
              <span className="flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-indigo-400" />
                <span>Create Custom Mute / Solo Group</span>
              </span>
              <button
                onClick={() => setIsCreatingGroup(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <input
                type="text"
                placeholder="e.g. Group E • Drums & Percussion"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="flex-1 min-w-[200px] bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-white placeholder-slate-500 font-mono"
                autoFocus
              />
              <div className="flex items-center gap-1.5">
                {GROUP_PALETTE.map((pal) => (
                  <button
                    key={pal.hex}
                    type="button"
                    onClick={() => setNewGroupColor(pal.hex)}
                    className={`w-5 h-5 rounded-full transition border cursor-pointer ${
                      newGroupColor === pal.hex ? 'border-white scale-110 shadow-sm' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: pal.hex }}
                    title={pal.name}
                  />
                ))}
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleCreateCustomGroup}
                  disabled={!newGroupName.trim()}
                  className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold transition cursor-pointer"
                >
                  Create Group
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreatingGroup(false)}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal / inline form to edit an existing group */}
        {editingGroupId && (
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-200">
              <span className="flex items-center gap-1.5">
                <Settings2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Edit Group Properties</span>
              </span>
              <button
                onClick={() => setEditingGroupId(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <input
                type="text"
                value={editGroupName}
                onChange={(e) => setEditGroupName(e.target.value)}
                className="flex-1 min-w-[200px] bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-white font-mono"
              />
              <div className="flex items-center gap-1.5">
                {GROUP_PALETTE.map((pal) => (
                  <button
                    key={pal.hex}
                    type="button"
                    onClick={() => setEditGroupColor(pal.hex)}
                    className={`w-5 h-5 rounded-full transition border cursor-pointer ${
                      editGroupColor === pal.hex ? 'border-white scale-110 shadow-sm' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: pal.hex }}
                    title={pal.name}
                  />
                ))}
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSaveEditGroup(editingGroupId)}
                  className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition cursor-pointer"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteGroup(editingGroupId)}
                  className="px-2.5 py-1 rounded bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-600/40 text-xs transition cursor-pointer"
                >
                  Delete Group
                </button>
                <button
                  type="button"
                  onClick={() => setEditingGroupId(null)}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Group Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {groups.map((grp) => {
            const members = tracks.filter((t) => t.groupId === grp.id);
            const isAllMuted = members.length > 0 && members.every((t) => t.muted);
            const isSomeMuted = members.length > 0 && members.some((t) => t.muted) && !isAllMuted;
            const isAllSolo = members.length > 0 && members.every((t) => t.solo);
            const isSomeSolo = members.length > 0 && members.some((t) => t.solo) && !isAllSolo;

            return (
              <div
                key={grp.id}
                className="bg-slate-900/70 border border-slate-800/90 rounded-xl p-2.5 flex flex-col justify-between gap-2 transition hover:border-slate-700 relative overflow-hidden"
              >
                {/* Color strip accent on top */}
                <div
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{ backgroundColor: grp.color }}
                />

                {/* Group Title and Info */}
                <div className="flex items-center justify-between gap-1 pt-1">
                  <div className="flex items-center gap-1.5 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                      style={{ backgroundColor: grp.color }}
                    />
                    <span className="text-[11px] font-bold text-white truncate" title={grp.name}>
                      {grp.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono text-slate-400 bg-slate-800 border border-slate-700/50">
                      {members.length} {members.length === 1 ? 'trk' : 'trks'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingGroupId(grp.id);
                        setEditGroupName(grp.name);
                        setEditGroupColor(grp.color);
                      }}
                      className="p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition cursor-pointer"
                      title="Edit group"
                    >
                      <Settings2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Member Channels Pills */}
                <div className="flex items-center gap-1 flex-wrap min-h-[22px]">
                  {members.length === 0 ? (
                    <span className="text-[10px] text-slate-600 italic">No channels assigned</span>
                  ) : (
                    members.map((m) => (
                      <span
                        key={m.id}
                        className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-slate-950 text-slate-300 border border-slate-800 truncate max-w-[100px]"
                        title={`Channel ${m.id}: ${m.name}`}
                      >
                        Ch{m.id}: {m.name.split(':')[1]?.trim() || m.name.split(' ')[0]}
                      </span>
                    ))
                  )}
                </div>

                {/* Mute and Solo Control Buttons */}
                <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => handleToggleGroupMute(grp.id)}
                    disabled={members.length === 0}
                    className={`py-1 rounded text-[10px] font-mono font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                      members.length === 0
                        ? 'opacity-30 cursor-not-allowed bg-slate-800/50 text-slate-600'
                        : isAllMuted
                        ? 'bg-rose-600 text-white ring-1 ring-rose-400 shadow-sm'
                        : isSomeMuted
                        ? 'bg-rose-950 text-rose-300 border border-rose-700/50 hover:bg-rose-900'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                    }`}
                    title={isAllMuted ? 'Unmute Group' : 'Mute Group'}
                  >
                    <span>MUTE</span>
                    {isAllMuted && <span className="text-[8px] font-mono bg-rose-950/80 px-1 rounded">ALL</span>}
                    {isSomeMuted && <span className="text-[8px] font-mono bg-rose-900/80 px-1 rounded">MIX</span>}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleGroupSolo(grp.id)}
                    disabled={members.length === 0}
                    className={`py-1 rounded text-[10px] font-mono font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                      members.length === 0
                        ? 'opacity-30 cursor-not-allowed bg-slate-800/50 text-slate-600'
                        : isAllSolo
                        ? 'bg-amber-500 text-slate-950 font-black ring-1 ring-amber-300 shadow-sm'
                        : isSomeSolo
                        ? 'bg-amber-950 text-amber-300 border border-amber-600/50 hover:bg-amber-900'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                    }`}
                    title={isAllSolo ? 'Clear Group Solo' : 'Solo Group'}
                  >
                    <span>SOLO</span>
                    {isAllSolo && <span className="text-[8px] font-mono bg-amber-600 text-slate-950 px-1 rounded font-black">ALL</span>}
                    {isSomeSolo && <span className="text-[8px] font-mono bg-amber-900/80 px-1 rounded">MIX</span>}
                  </button>
                </div>
              </div>
            );
          })}
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

        {tracks.map((trk, i) => {
          const isDragTarget = dragOverChannelId === trk.id;
          const autoState = trackAutomation[trk.id] || defaultAutomationForTrack(trk);
          const isLaneExpanded = autoState.isExpanded;
          const isLaneActive = !autoState.volumeBypass || !autoState.panBypass;
          const dynamicVol = liveDynamicValues[trk.id]?.vol;
          const dynamicPan = liveDynamicValues[trk.id]?.pan;
          const trkGroup = groups.find((g) => g.id === trk.groupId);

          return (
            <div
              key={trk.id}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
                if (dragOverChannelId !== trk.id) setDragOverChannelId(trk.id);
              }}
              onDragLeave={() => {
                if (dragOverChannelId === trk.id) setDragOverChannelId(null);
              }}
              onDrop={(e) => handleDropOnChannel(trk.id, e)}
              className={`relative rounded-xl p-4 flex flex-col gap-3 transition border ${
                isDragTarget
                  ? 'bg-cyan-950/80 border-cyan-400 ring-2 ring-cyan-500/60 shadow-xl shadow-cyan-950/60 scale-[1.01]'
                  : 'bg-slate-950 border-slate-800/90 hover:border-slate-700'
              }`}
              style={trkGroup ? { borderLeft: `4px solid ${trkGroup.color}` } : undefined}
            >
              {isDragTarget && (
                <div className="absolute inset-0 bg-cyan-950/95 rounded-xl border-2 border-dashed border-cyan-400 flex items-center justify-center gap-2 z-20 animate-pulse text-cyan-200 font-mono text-xs font-bold pointer-events-none">
                  <GripVertical className="w-5 h-5 text-cyan-400" />
                  <span>DROP WEBDAV ASSET HERE TO ROUTE TO CHANNEL {trk.id}</span>
                </div>
              )}

              {/* Main Channel Controls Row */}
              <div className="flex items-center justify-between flex-wrap gap-4 w-full">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-white text-xs shadow-md relative"
                    style={{ backgroundColor: trk.color }}
                  >
                    {i + 1}
                    {trkGroup && (
                      <span
                        className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border border-slate-950 shadow-xs"
                        style={{ backgroundColor: trkGroup.color }}
                        title={`Assigned to ${trkGroup.name}`}
                      />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-2 flex-wrap">
                      <span>{trk.name}</span>
                      {trkGroup && (
                        <span
                          className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase border flex items-center gap-1"
                          style={{
                            borderColor: `${trkGroup.color}60`,
                            backgroundColor: `${trkGroup.color}15`,
                            color: trkGroup.color
                          }}
                          title={`Track assigned to ${trkGroup.name}`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: trkGroup.color }} />
                          <span>{trkGroup.name.split('•')[0].trim()}</span>
                        </span>
                      )}
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
                <div className="flex items-center gap-4 sm:gap-5 flex-wrap">
                  {/* Mute / Solo / Group */}
                  <div className="flex items-center gap-1.5 relative">
                    <button
                      onClick={(e) => handleTrackMuteClick(trk.id, e)}
                      className={`px-2.5 py-1 rounded text-[11px] font-bold transition font-mono cursor-pointer ${
                        trk.muted
                          ? 'bg-rose-600 text-white ring-1 ring-rose-400 shadow-sm'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                      }`}
                      title={
                        trk.groupId
                          ? `Mute Track ${isGroupLinkingEnabled ? `(Linked with ${trkGroup?.name || 'group'} • Alt+Click to isolate)` : '(Group link suspended)'}`
                          : 'Mute Track'
                      }
                    >
                      M
                    </button>
                    <button
                      onClick={(e) => handleTrackSoloClick(trk.id, e)}
                      className={`px-2.5 py-1 rounded text-[11px] font-bold transition font-mono cursor-pointer ${
                        trk.solo
                          ? 'bg-amber-500 text-slate-950 font-black ring-1 ring-amber-300 shadow-sm'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                      }`}
                      title={
                        trk.groupId
                          ? `Solo Track ${isGroupLinkingEnabled ? `(Linked with ${trkGroup?.name || 'group'} • Alt+Click to isolate)` : '(Group link suspended)'}`
                          : 'Solo Track'
                      }
                    >
                      S
                    </button>

                    {/* Group Selector Dropdown */}
                    <div className="relative">
                      <button
                        onClick={() => setActiveGroupMenuTrackId(activeGroupMenuTrackId === trk.id ? null : trk.id)}
                        className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition flex items-center gap-1 border cursor-pointer ${
                          trkGroup
                            ? 'bg-slate-900 hover:bg-slate-800 text-slate-200'
                            : 'bg-slate-800/80 hover:bg-slate-800 text-slate-400 border-dashed border-slate-700'
                        }`}
                        style={trkGroup ? { borderColor: `${trkGroup.color}80` } : undefined}
                        title="Assign channel to Mute/Solo Group"
                      >
                        {trkGroup ? (
                          <>
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: trkGroup.color }} />
                            <span className="truncate max-w-[70px]">{trkGroup.name.split('•')[0].trim()}</span>
                            {isGroupLinkingEnabled && <Link2 className="w-2.5 h-2.5 text-slate-400 shrink-0" />}
                          </>
                        ) : (
                          <>
                            <Users className="w-3 h-3 text-slate-500" />
                            <span>+ Group</span>
                          </>
                        )}
                        <ChevronDown className="w-2.5 h-2.5 text-slate-500" />
                      </button>

                      {/* Group Picker Dropdown Menu */}
                      {activeGroupMenuTrackId === trk.id && (
                        <div className="absolute top-full left-0 mt-1.5 w-60 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-30 space-y-1 font-mono text-xs">
                          <div className="flex items-center justify-between px-2 py-1 border-b border-slate-800 text-[10px] text-slate-400 font-bold uppercase">
                            <span>Assign Ch {trk.id} to Group</span>
                            <button onClick={() => setActiveGroupMenuTrackId(null)} className="text-slate-500 hover:text-white cursor-pointer">
                              <X className="w-3 h-3" />
                            </button>
                          </div>

                          {/* None / Unassigned */}
                          <button
                            onClick={() => handleAssignTrackGroup(trk.id, null)}
                            className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center justify-between text-[11px] transition cursor-pointer ${
                              !trk.groupId ? 'bg-indigo-600/20 text-indigo-300 font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                            }`}
                          >
                            <span>None (Independent)</span>
                            {!trk.groupId && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                          </button>

                          <div className="pt-1 border-t border-slate-800 text-[9px] text-slate-500 uppercase px-2 font-bold">
                            Active Groups
                          </div>

                          {groups.map((g) => {
                            const isCurrent = trk.groupId === g.id;
                            const memberCount = tracks.filter((t) => t.groupId === g.id).length;
                            return (
                              <button
                                key={g.id}
                                onClick={() => handleAssignTrackGroup(trk.id, g.id)}
                                className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center justify-between text-[11px] transition cursor-pointer ${
                                  isCurrent
                                    ? 'bg-slate-800 text-white font-bold ring-1 ring-slate-700'
                                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                                }`}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: g.color }} />
                                  <span className="truncate">{g.name}</span>
                                </div>
                                <div className="flex items-center gap-1 text-[10px] text-slate-500 shrink-0">
                                  <span>{memberCount} trk</span>
                                  {isCurrent && <Check className="w-3.5 h-3.5 text-emerald-400 ml-1" />}
                                </div>
                              </button>
                            );
                          })}

                          <div className="pt-1.5 border-t border-slate-800">
                            <button
                              onClick={() => {
                                setActiveGroupMenuTrackId(null);
                                setIsCreatingGroup(true);
                              }}
                              className="w-full text-left px-2 py-1.5 rounded-lg text-[10px] text-indigo-400 hover:bg-indigo-950/50 flex items-center gap-1.5 transition cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Create New Custom Group...</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
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
                      {(() => {
                        const effectivePan = (!autoState.panBypass && dynamicPan !== undefined) ? dynamicPan : trk.pan;
                        return effectivePan === 0 ? 'C' : effectivePan < 0 ? `L${Math.abs(effectivePan)}` : `R${effectivePan}`;
                      })()}
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
                    <span className="text-xs font-mono text-slate-300 w-9 text-right font-bold">
                      {(!autoState.volumeBypass && dynamicVol !== undefined) ? dynamicVol : trk.vol}%
                    </span>
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
                    <span>0.0s – 60.0s</span>
                  </div>

                  {/* Expandable Automation Lane Toggle Button */}
                  <button
                    type="button"
                    onClick={() => handleToggleAutomationLane(trk.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-bold transition cursor-pointer border ${
                      isLaneExpanded
                        ? 'bg-indigo-600 text-white border-indigo-400 shadow-md ring-1 ring-indigo-400/40'
                        : isLaneActive
                        ? 'bg-emerald-950/90 text-emerald-300 border-emerald-600/60 hover:bg-emerald-900/60'
                        : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border-slate-800'
                    }`}
                    title={isLaneExpanded ? 'Collapse Automation Lane' : 'Expand Volume & Pan Automation Lane'}
                  >
                    <Activity className={`w-3.5 h-3.5 ${isLaneActive ? 'text-emerald-400 animate-pulse' : 'text-indigo-400'}`} />
                    <span>AUTO</span>
                    {isLaneActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                    {isLaneExpanded ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
                  </button>
                </div>
              </div>

              {/* Expandable Automation Lane Drawer */}
              {isLaneExpanded && (
                <div className="w-full pt-1 border-t border-slate-800/80 animate-in fade-in slide-in-from-top-2 duration-150">
                  <AutomationLaneEditor
                    track={trk}
                    automationState={autoState}
                    onChangeAutomation={(newState) => handleUpdateAutomation(trk.id, newState)}
                    playbackProgressPercent={playbackProgressPercent}
                    currentLiveVol={dynamicVol}
                    currentLivePan={dynamicPan}
                    isDarkMode={isDarkMode}
                  />
                </div>
              )}
            </div>
          );
        })}

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
      </div>

      {/* ASSET-LINK & STEM ROUTING LOADING OVERLAY */}
      {isLinkingAsset && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl p-6 max-w-sm w-full shadow-2xl shadow-cyan-950/60 text-center space-y-3.5">
            <div className="w-12 h-12 rounded-xl bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center mx-auto text-cyan-400">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Nextcloud Asset Link in Progress</h4>
              <p className="text-xs text-slate-300 mt-1 font-mono">{linkingAssetLabel || 'Resolving WebDAV stems...'}</p>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-full w-2/3 animate-pulse rounded-full" />
            </div>
            <p className="text-[10px] text-slate-500 font-mono">Nextcloud Folder 207332 • Lossless PCM Audio Bridge</p>
          </div>
        </div>
      )}
    </div>
  );
};
