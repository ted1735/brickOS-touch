import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Sliders,
  Upload,
  Music,
  CheckCircle,
  Trophy,
  Activity,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  FastForward,
  Rewind,
  Download,
  Copy,
  Check,
  Sparkles,
  ArrowRight,
  RefreshCw,
  FolderOpen,
  Headphones,
  SlidersHorizontal,
  ChevronDown,
  Layers,
  FileAudio,
  ThumbsUp,
  ThumbsDown,
  FileText,
  Plus,
  Minus,
  AlertCircle,
  Zap,
  Loader2
} from 'lucide-react';
import { Track } from '../types';
import { CANONICAL_TRACKS } from '../data/canonicalCatalog';
import { songVersionsCatalog } from '../data/songVersionsCatalog';
import { ALL_CANONICAL_NEXTCLOUD_ASSETS, getTrackStems, getTrackNextcloudAssets } from '../data/nextcloudAssetIndex';
import { SUNO_MASTER_TRACKS, SunoTrackMeta } from '../data/sunoMasterCatalog';
import { RELATIONAL_SUNO_CATALOG, getSongRevisions } from '../data/relationalSunoCatalog';

export interface AudioTrackSlot {
  id: 'slot-a' | 'slot-b' | 'slot-c';
  slotLetter: 'A' | 'B' | 'C';
  label: string;
  title: string;
  versionTag: string;
  genre: string;
  bpm: number;
  key: string;
  sourceType: 'catalog' | 'upload' | 'preset' | 'webdav' | 'suno';
  fileName?: string;
  durationSeconds: number;
  currentTimeSeconds: number;
  isPlaying: boolean;
  isMuted: boolean;
  isSolo: boolean;
  isLooping: boolean;
  volume: number; // 0.0 to 1.5 (1.0 = 0 dB)
  pan: number; // -1.0 (Left) to +1.0 (Right)
  playbackRate: number; // 0.75, 1.0, 1.25, 1.5
  estimatedLufs: number; // e.g. -12.5 LUFS
  peakDb: number; // e.g. -0.8 dBTP
  lufsTrimDb: number; // gain offset to hit -14.0 LUFS
  peakData: number[]; // 160 peak amplitudes (0.0 to 1.0) for waveform
  audioBuffer?: AudioBuffer | null;
  audioBlobUrl?: string;
  scores: {
    frequencyBalance: number; // 1-10
    dynamicRange: number; // 1-10
    vocalClarity: number; // 1-10
    lowEndControl: number; // 1-10
    emotionalImpact: number; // 1-10
  };
  pros: string;
  cons: string;
  notes: string;
  isCrownedWinner: boolean;
  colorScheme: {
    primary: string;
    border: string;
    bg: string;
    badgeBg: string;
    accent: string;
    waveformColor: string;
    wavePlayheadColor: string;
  };
}

interface AudioComparisonABCProps {
  activeTrack?: Track;
  onNavigateToTab?: (tab: string) => void;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
  isDarkMode?: boolean;
}

// Generate realistic musical peaks for waveform visualizers
function generateDeterministicPeaks(seedStr: string, bars = 160): number[] {
  let seed = 1337;
  for (let i = 0; i < seedStr.length; i++) {
    seed = (seed * 31 + seedStr.charCodeAt(i)) >>> 0;
  }

  const peaks: number[] = [];
  for (let i = 0; i < bars; i++) {
    const phase = i / bars;
    let envelope = 0.5;
    // Section arc: Intro -> Verse 1 -> Chorus 1 -> Verse 2 -> Chorus 2 -> Bridge -> Big Chorus -> Outro
    if (phase < 0.12) {
      envelope = 0.35 + 0.18 * Math.sin(phase * Math.PI); // Intro
    } else if (phase < 0.32) {
      envelope = 0.6 + 0.2 * Math.sin((phase - 0.12) * 6); // Verse 1
    } else if (phase < 0.50) {
      envelope = 0.88 + 0.12 * Math.sin((phase - 0.32) * 8); // Chorus 1
    } else if (phase < 0.68) {
      envelope = 0.65 + 0.18 * Math.sin((phase - 0.50) * 5); // Verse 2
    } else if (phase < 0.78) {
      envelope = 0.45 + 0.3 * Math.sin((phase - 0.68) * 4); // Bridge breakdown
    } else if (phase < 0.94) {
      envelope = 0.96 + 0.04 * Math.sin((phase - 0.78) * 10); // Final Master Chorus
    } else {
      envelope = 0.40 * (1 - (phase - 0.94) / 0.06); // Outro fade
    }

    const pseudoNoise = Math.abs(Math.sin(seed * (i + 1) * 997)) * 0.32;
    const value = Math.min(1.0, Math.max(0.12, envelope * 0.72 + pseudoNoise));
    peaks.push(value);
  }
  return peaks;
}

// Format seconds into MM:SS.S
function formatTimecode(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  const tenths = Math.floor((secs % 1) * 10);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${tenths}`;
}

// Convert linear volume (0.0 to 1.5) to decibel string
function volumeToDb(v: number): string {
  if (v <= 0.001) return '-∞ dB';
  const db = 20 * Math.log10(v);
  return `${db >= 0 ? '+' : ''}${db.toFixed(1)} dB`;
}

export const AudioComparisonABC: React.FC<AudioComparisonABCProps> = ({
  activeTrack,
  onNavigateToTab,
  showToast,
  isDarkMode = true
}) => {
  // Web Audio Context reference for live real-time synthesis & buffer playback
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioNodesMap = useRef<{
    [slotId: string]: {
      gainNode: GainNode;
      pannerNode: StereoPannerNode;
      oscNodes?: OscillatorNode[];
      bufferSource?: AudioBufferSourceNode;
      analyserNode: AnalyserNode;
    };
  }>({});

  // Canvas refs for the three waveforms
  const canvasRefs = {
    'slot-a': useRef<HTMLCanvasElement | null>(null),
    'slot-b': useRef<HTMLCanvasElement | null>(null),
    'slot-c': useRef<HTMLCanvasElement | null>(null),
  };

  // File input refs for uploading audio
  const fileInputRefs = {
    'slot-a': useRef<HTMLInputElement | null>(null),
    'slot-b': useRef<HTMLInputElement | null>(null),
    'slot-c': useRef<HTMLInputElement | null>(null),
  };

  // Master comparison modes
  const [syncPlayback, setSyncPlayback] = useState<boolean>(true); // Forces all 3 tracks to start/stop simultaneously
  const [syncPlayheads, setSyncPlayheads] = useState<boolean>(true); // Locked scrub across A, B, C
  const [loudnessMatchEnabled, setLoudnessMatchEnabled] = useState<boolean>(true); // -14 LUFS auto gain trim
  const [blindModeEnabled, setBlindModeEnabled] = useState<boolean>(false); // Double-blind ABX testing
  const [blindRevealed, setBlindRevealed] = useState<boolean>(false);
  const [blindShuffle, setBlindShuffle] = useState<number[]>([0, 1, 2]);
  const [activeSoloSlot, setActiveSoloSlot] = useState<string | null>(null); // Quick exclusive A/B/C solo
  const [activeSectionRange, setActiveSectionRange] = useState<'full' | 'intro' | 'verse1' | 'chorus1' | 'bridge' | 'outro'>('full');

  // Available Nextcloud audio assets for the active track
  const availableNextcloudAudioAssets = useMemo(() => {
    const targetTrackId = activeTrack?.id || CANONICAL_TRACKS[0]?.id || 'TRK-01';
    const all = getTrackNextcloudAssets(targetTrackId, activeTrack?.title);
    return all.filter(a => Boolean(a.audioUrl) && (
      a.category.includes('AUDIO') ||
      a.category.includes('STEM') ||
      (a.mimeType && a.mimeType.includes('audio')) ||
      a.filename.endsWith('.flac') ||
      a.filename.endsWith('.wav') ||
      a.filename.endsWith('.mp3')
    ));
  }, [activeTrack?.id, activeTrack?.title]);

  // Initial tracks initialization with real Nextcloud streams
  const initialSlots = useMemo<AudioTrackSlot[]>(() => {
    // Attempt to pull versions from canonical track
    const targetTrack: Track = activeTrack || CANONICAL_TRACKS[0];
    const catVersions = songVersionsCatalog[targetTrack.id]?.versions || [];
    const baseTitle = targetTrack.title || targetTrack.id || "Master Comparison";
    const bpm = targetTrack.bpm || 110;
    const key = targetTrack.key || 'E Minor';

    const stems = getTrackStems(targetTrack);
    const audioAssets = availableNextcloudAudioAssets;

    const masterStem = stems.find(s => s.stemType === 'master') || stems[0];
    const vocalStem = stems.find(s => s.stemType === 'vocal' || s.stemType === 'guitar') || stems[1] || masterStem;
    const instStem = stems.find(s => s.stemType === 'drums' || s.stemType === 'organ' || s.stemType === 'piano' || s.stemType === 'bass') || stems[2] || masterStem;

    const masterAudioUrl = masterStem?.audioUrl ||
      audioAssets.find(a => a.category === 'MASTER_AUDIO')?.audioUrl ||
      audioAssets[0]?.audioUrl || '';

    const vocalAudioUrl = vocalStem?.audioUrl ||
      audioAssets.find(a => a.category === 'UVR5_VOCAL_STEM')?.audioUrl ||
      audioAssets[1]?.audioUrl ||
      masterAudioUrl;

    const instAudioUrl = instStem?.audioUrl ||
      audioAssets.find(a => a.category === 'INSTRUMENTAL_STEM')?.audioUrl ||
      audioAssets[2]?.audioUrl ||
      masterAudioUrl;

    const masterFile = masterStem?.webdavPath?.split('/').pop() ||
      masterStem?.name ||
      audioAssets[0]?.filename ||
      `${baseTitle} Master Cut`;

    const vocalFile = vocalStem?.webdavPath?.split('/').pop() ||
      vocalStem?.name ||
      audioAssets[1]?.filename ||
      `${baseTitle} Vocal Stem`;

    const instFile = instStem?.webdavPath?.split('/').pop() ||
      instStem?.name ||
      audioAssets[2]?.filename ||
      `${baseTitle} Backing Bed Stem`;

    return [
      {
        id: 'slot-a',
        slotLetter: 'A',
        label: 'Take A (Reference / Master)',
        title: baseTitle,
        versionTag: catVersions[0]?.versionTag || 'v8.0 (Master Audio Cut)',
        genre: targetTrack.genre || 'Modern Production',
        bpm: bpm,
        key: key,
        sourceType: 'catalog',
        fileName: masterFile,
        audioBlobUrl: masterAudioUrl,
        durationSeconds: 218,
        currentTimeSeconds: 0,
        isPlaying: false,
        isMuted: false,
        isSolo: false,
        isLooping: true,
        volume: 1.0,
        pan: 0,
        playbackRate: 1.0,
        estimatedLufs: -11.4,
        peakDb: -0.2,
        lufsTrimDb: -2.6, // Trim down to hit -14 LUFS
        peakData: generateDeterministicPeaks(`${baseTitle}_TakeA_Master`, 160),
        scores: { frequencyBalance: 9, dynamicRange: 8, vocalClarity: 9, lowEndControl: 9, emotionalImpact: 9 },
        pros: 'Massive transient punch on the 808 drop; crisp vocal presence in the upper-mid range.',
        cons: 'High-frequency supersaws are slightly aggressive; potential ear fatigue over extended listening.',
        notes: 'Explosive high-energy mix. Sits forward in the mix with aggressive 808 transient punch.',
        isCrownedWinner: true,
        colorScheme: {
          primary: 'text-amber-400',
          border: 'border-amber-500/40',
          bg: 'bg-amber-950/20',
          badgeBg: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
          accent: '#f59e0b',
          waveformColor: '#f59e0b',
          wavePlayheadColor: '#fbbf24'
        }
      },
      {
        id: 'slot-b',
        slotLetter: 'B',
        label: 'Take B (Isolated Vocal / Radio Cut)',
        title: baseTitle,
        versionTag: catVersions[1]?.versionTag || 'v6.0 (Vocal / Stem Mix)',
        genre: targetTrack.genre || 'Vocal Focus',
        bpm: bpm,
        key: key,
        sourceType: 'catalog',
        fileName: vocalFile,
        audioBlobUrl: vocalAudioUrl,
        durationSeconds: 218,
        currentTimeSeconds: 0,
        isPlaying: false,
        isMuted: false,
        isSolo: false,
        isLooping: true,
        volume: 1.0,
        pan: 0,
        playbackRate: 1.0,
        estimatedLufs: -14.2,
        peakDb: -0.8,
        lufsTrimDb: +0.2,
        peakData: generateDeterministicPeaks(`${baseTitle}_TakeB_Radio`, 160),
        scores: { frequencyBalance: 9, dynamicRange: 9, vocalClarity: 8, lowEndControl: 8, emotionalImpact: 8 },
        pros: 'Warm acoustic resonance; exceptional vocal clarity and dynamic separation.',
        cons: 'Dry vocal requires gentle plate reverb for natural room integration.',
        notes: 'UVR5 isolated vocal delivery with clean transients and high speech intelligibility.',
        isCrownedWinner: false,
        colorScheme: {
          primary: 'text-cyan-400',
          border: 'border-cyan-500/40',
          bg: 'bg-cyan-950/20',
          badgeBg: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
          accent: '#06b6d4',
          waveformColor: '#06b6d4',
          wavePlayheadColor: '#22d3ee'
        }
      },
      {
        id: 'slot-c',
        slotLetter: 'C',
        label: 'Take C (Backing Instrumental / Alt Cut)',
        title: baseTitle,
        versionTag: catVersions[2]?.versionTag || 'v1.0 (Instrumental Bed / Alt Take)',
        genre: targetTrack.genre || 'Instrumental',
        bpm: bpm,
        key: key,
        sourceType: 'catalog',
        fileName: instFile,
        audioBlobUrl: instAudioUrl,
        durationSeconds: 218,
        currentTimeSeconds: 0,
        isPlaying: false,
        isMuted: false,
        isSolo: false,
        isLooping: true,
        volume: 1.0,
        pan: 0,
        playbackRate: 1.0,
        estimatedLufs: -18.6,
        peakDb: -2.4,
        lufsTrimDb: +4.6, // Trim up to match -14 LUFS
        peakData: generateDeterministicPeaks(`${baseTitle}_TakeC_Acoustic`, 160),
        scores: { frequencyBalance: 8, dynamicRange: 10, vocalClarity: 8, lowEndControl: 7, emotionalImpact: 9 },
        pros: 'Completely unvarnished instrumental dynamics; rich harmonic content.',
        cons: 'Dynamic swings wide without compression.',
        notes: 'Full rhythm and harmonic section bed; pristine acoustic clarity.',
        isCrownedWinner: false,
        colorScheme: {
          primary: 'text-purple-400',
          border: 'border-purple-500/40',
          bg: 'bg-purple-950/20',
          badgeBg: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
          accent: '#a855f7',
          waveformColor: '#a855f7',
          wavePlayheadColor: '#c084fc'
        }
      }
    ];
  }, [activeTrack?.id, activeTrack?.title, activeTrack?.bpm, activeTrack?.key, availableNextcloudAudioAssets]);

  const [slots, setSlots] = useState<AudioTrackSlot[]>(initialSlots);

  // Sync slots whenever initialSlots updates for activeTrack
  useEffect(() => {
    setSlots(initialSlots);
  }, [initialSlots]);

  // Real Audio Elements Map for seamless streaming
  const audioElementsRef = useRef<{ [slotId: string]: HTMLAudioElement }>({});

  // Real-time audio loading / buffering indicators to prevent impatient multi-clicks
  const [loadingSlots, setLoadingSlots] = useState<{ [slotId: string]: boolean }>({});
  const isAnySlotLoading = useMemo(() => Object.values(loadingSlots).some(Boolean), [loadingSlots]);

  // When activeTrack?.id changes, halt and dispose old audio elements so old track NEVER keeps playing in background
  useEffect(() => {
    Object.values(audioElementsRef.current).forEach(el => {
      try {
        el.pause();
        el.currentTime = 0;
        el.src = '';
        try { el.load(); } catch (_) {}
      } catch (_) {}
    });
    audioElementsRef.current = {};
    setLoadingSlots({});
  }, [activeTrack?.id]);

  // Attach audio loading, buffering, and ready listeners to prevent impatient clicks
  const attachAudioLoadingListeners = useCallback((el: HTMLAudioElement, slotId: string) => {
    if ((el as any)._hasLoadingListeners) return;
    (el as any)._hasLoadingListeners = true;

    const onWait = () => {
      setLoadingSlots(prev => ({ ...prev, [slotId]: true }));
    };
    const onPlaying = () => {
      setLoadingSlots(prev => ({ ...prev, [slotId]: false }));
    };
    const onEndedOrPause = () => {
      setLoadingSlots(prev => ({ ...prev, [slotId]: false }));
    };
    const onError = () => {
      setLoadingSlots(prev => ({ ...prev, [slotId]: false }));
    };

    el.addEventListener('waiting', onWait);
    el.addEventListener('loadstart', () => {
      if (!el.paused) setLoadingSlots(prev => ({ ...prev, [slotId]: true }));
    });
    el.addEventListener('canplay', onPlaying);
    el.addEventListener('playing', onPlaying);
    el.addEventListener('pause', onEndedOrPause);
    el.addEventListener('ended', onEndedOrPause);
    el.addEventListener('error', onError);
  }, []);

  // Fallback audio URL resolver to guarantee real Nextcloud streaming
  const resolveSlotAudioUrl = useCallback((slotId: string, currentUrl?: string): string => {
    if (currentUrl && currentUrl.trim().length > 0) return currentUrl;
    const targetTrack = activeTrack || CANONICAL_TRACKS[0];
    const stems = getTrackStems(targetTrack);
    const audioAssets = availableNextcloudAudioAssets;

    if (slotId === 'slot-a') {
      return stems.find(s => s.stemType === 'master')?.audioUrl ||
        audioAssets.find(a => a.category === 'MASTER_AUDIO')?.audioUrl ||
        stems[0]?.audioUrl || audioAssets[0]?.audioUrl || '';
    } else if (slotId === 'slot-b') {
      return stems.find(s => s.stemType === 'vocal' || s.stemType === 'guitar')?.audioUrl ||
        audioAssets.find(a => a.category === 'UVR5_VOCAL_STEM')?.audioUrl ||
        stems[1]?.audioUrl || stems[0]?.audioUrl || '';
    } else {
      return stems.find(s => s.stemType === 'drums' || s.stemType === 'organ' || s.stemType === 'piano' || s.stemType === 'bass')?.audioUrl ||
        audioAssets.find(a => a.category === 'INSTRUMENTAL_STEM')?.audioUrl ||
        stems[2]?.audioUrl || stems[0]?.audioUrl || '';
    }
  }, [activeTrack, availableNextcloudAudioAssets]);

  // Synchronously ensure HTMLAudioElement exists and has real audio src loaded immediately on click
  const getOrCreateAudioElement = useCallback((slot: AudioTrackSlot): HTMLAudioElement => {
    let el = audioElementsRef.current[slot.id];
    if (!el) {
      el = new Audio();
      el.crossOrigin = 'anonymous';
      el.preload = 'auto';
      audioElementsRef.current[slot.id] = el;
      attachAudioLoadingListeners(el, slot.id);
    }
    const resolvedUrl = resolveSlotAudioUrl(slot.id, slot.audioBlobUrl);
    const currentLoaded = (el as any)._loadedAudioUrl;
    if (resolvedUrl && currentLoaded !== resolvedUrl) {
      (el as any)._loadedAudioUrl = resolvedUrl;
      el.src = resolvedUrl;
      el.load();
    }
    return el;
  }, [resolveSlotAudioUrl, attachAudioLoadingListeners]);

  // 1. Maintain and preload HTMLAudioElements only when slot audio URLs actually change
  useEffect(() => {
    slots.forEach(slot => {
      const url = resolveSlotAudioUrl(slot.id, slot.audioBlobUrl);
      if (!url) return;

      let el = audioElementsRef.current[slot.id];
      if (!el) {
        el = new Audio();
        el.crossOrigin = 'anonymous';
        el.preload = 'auto';
        audioElementsRef.current[slot.id] = el;
        attachAudioLoadingListeners(el, slot.id);
      }

      // Check if URL actually changed using custom tracked property to prevent infinite reload loops
      const currentLoaded = (el as any)._loadedAudioUrl;
      if (currentLoaded !== url) {
        (el as any)._loadedAudioUrl = url;
        el.src = url;
        el.load();
      }
    });
  }, [slots.map(s => `${s.id}:${s.audioBlobUrl}`).join(','), resolveSlotAudioUrl, attachAudioLoadingListeners]);

  // 2. Synchronize Volume, Pan, Mute, and Exclusive Solo without interrupting audio flow
  useEffect(() => {
    slots.forEach(slot => {
      const el = audioElementsRef.current[slot.id];
      if (!el) return;

      el.loop = slot.isLooping;
      el.playbackRate = slot.playbackRate || 1.0;

      // Handle muting and exclusive soloing
      let isMuted = slot.isMuted;
      if (activeSoloSlot && activeSoloSlot !== slot.id) {
        isMuted = true;
      }
      el.muted = isMuted;

      // Calculate effective volume with LUFS trim
      let effectiveVol = slot.volume;
      if (loudnessMatchEnabled && slot.lufsTrimDb) {
        const trimFactor = Math.pow(10, slot.lufsTrimDb / 20);
        effectiveVol = effectiveVol * trimFactor;
      }
      el.volume = Math.max(0, Math.min(1, effectiveVol * 0.95));
    });
  }, [slots.map(s => `${s.id}:${s.volume}:${s.isMuted}:${s.isLooping}:${s.playbackRate}`).join(','), activeSoloSlot, loudnessMatchEnabled]);

  // Cleanup audio elements on unmount
  useEffect(() => {
    return () => {
      Object.values(audioElementsRef.current).forEach(el => {
        el.pause();
        el.src = '';
      });
      audioElementsRef.current = {};
    };
  }, []);

  // Initialize Web Audio graph
  const ensureAudioGraph = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    const ctx = audioCtxRef.current;

    slots.forEach(slot => {
      if (!audioNodesMap.current[slot.id]) {
        const gainNode = ctx.createGain();
        const pannerNode = ctx.createStereoPanner();
        const analyserNode = ctx.createAnalyser();
        analyserNode.fftSize = 128;

        gainNode.connect(pannerNode);
        pannerNode.connect(analyserNode);
        analyserNode.connect(ctx.destination);

        audioNodesMap.current[slot.id] = {
          gainNode,
          pannerNode,
          analyserNode
        };
      }
    });
  }, [slots]);

  // Update gain and pan nodes whenever slot values or loudness matching change
  useEffect(() => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;

    slots.forEach(slot => {
      const nodeObj = audioNodesMap.current[slot.id];
      if (!nodeObj) return;

      // Calculate effective gain
      let effectiveGain = slot.volume;
      if (slot.isMuted) {
        effectiveGain = 0;
      } else if (activeSoloSlot && activeSoloSlot !== slot.id) {
        effectiveGain = 0; // Muted by exclusive solo
      } else if (loudnessMatchEnabled) {
        // Apply LUFS normalization trim
        const trimFactor = Math.pow(10, slot.lufsTrimDb / 20);
        effectiveGain = effectiveGain * trimFactor;
      }

      nodeObj.gainNode.gain.setValueAtTime(Math.max(0, effectiveGain * 0.28), ctx.currentTime);
      nodeObj.pannerNode.pan.setValueAtTime(slot.pan, ctx.currentTime);
    });
  }, [slots, loudnessMatchEnabled, activeSoloSlot]);

  // Playhead loop animation frame - optimized to sleep when paused
  const isAnyPlaying = useMemo(() => slots.some(s => s.isPlaying), [slots]);

  useEffect(() => {
    if (!isAnyPlaying) return;

    let animId: number;
    let lastTime = performance.now();

    const updateLoop = (now: number) => {
      const deltaSec = (now - lastTime) / 1000;
      lastTime = now;

      setSlots(prevSlots => {
        if (!prevSlots.some(s => s.isPlaying)) return prevSlots;

        return prevSlots.map(slot => {
          if (!slot.isPlaying) return slot;

          const el = audioElementsRef.current[slot.id];
          if (el && el.paused && slot.isPlaying && !el.ended) {
            el.play().catch(() => {});
          }
          const hasAudioClock = Boolean(el && !el.paused && !isNaN(el.currentTime) && el.currentTime >= 0);
          let nextTime = hasAudioClock ? el!.currentTime : slot.currentTimeSeconds + deltaSec * slot.playbackRate;

          // Section boundaries check
          if (activeSectionRange !== 'full') {
            const sectionRanges: { [key: string]: [number, number] } = {
              intro: [0, 24],
              verse1: [24, 60],
              chorus1: [60, 96],
              bridge: [120, 150],
              outro: [180, 218]
            };
            const [startSec, endSec] = sectionRanges[activeSectionRange] || [0, slot.durationSeconds];
            if (nextTime >= endSec) {
              nextTime = slot.isLooping ? startSec : endSec;
              if (el) {
                try { el.currentTime = nextTime; } catch (_) {}
              }
            }
          } else if (nextTime >= slot.durationSeconds) {
            nextTime = slot.isLooping ? 0 : slot.durationSeconds;
            if (el) {
              try { el.currentTime = nextTime; } catch (_) {}
            }
          }

          return {
            ...slot,
            currentTimeSeconds: nextTime
          };
        });
      });

      animId = requestAnimationFrame(updateLoop);
    };

    animId = requestAnimationFrame(updateLoop);
    return () => cancelAnimationFrame(animId);
  }, [isAnyPlaying, activeSectionRange]);

  // Canvas waveform rendering loop
  useEffect(() => {
    slots.forEach(slot => {
      const canvas = canvasRefs[slot.id]?.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const peaks = slot.peakData;
      const totalBars = peaks.length;
      const barWidth = w / totalBars;
      const gap = 1.2;
      const midY = h / 2;

      const progress = slot.currentTimeSeconds / (slot.durationSeconds || 1);

      // Draw background center guideline
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, midY);
      ctx.lineTo(w, midY);
      ctx.stroke();

      // Render vertical peak bars
      for (let i = 0; i < totalBars; i++) {
        const barProgress = i / totalBars;
        const isPast = barProgress <= progress;
        const amplitude = peaks[i];
        const barH = Math.max(3, amplitude * (h - 10));
        const x = i * barWidth;
        const y = midY - barH / 2;

        if (isPast) {
          ctx.fillStyle = slot.colorScheme.waveformColor;
          ctx.shadowColor = slot.colorScheme.waveformColor;
          ctx.shadowBlur = slot.isPlaying ? 4 : 0;
        } else {
          ctx.fillStyle = isDarkMode ? '#475569' : '#94a3b8';
          ctx.shadowBlur = 0;
        }

        ctx.fillRect(x + gap / 2, y, Math.max(1, barWidth - gap), barH);
      }
      ctx.shadowBlur = 0;

      // Draw playhead vertical line
      const playheadX = progress * w;
      ctx.strokeStyle = slot.colorScheme.wavePlayheadColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, h);
      ctx.stroke();

      // Draw glowing playhead cap
      ctx.fillStyle = slot.colorScheme.wavePlayheadColor;
      ctx.beginPath();
      ctx.arc(playheadX, 6, 4, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [slots, isDarkMode]);

  // Handle Play/Pause for a specific slot with synchronous real audio streaming and loading tracking
  const handleTogglePlay = (slotId: string) => {
    ensureAudioGraph();
    const target = slots.find(s => s.id === slotId);
    if (!target) return;
    const nextPlayState = !target.isPlaying;

    if (syncPlayback) {
      // When Sync Playback is ON, force all three audio tracks to start/stop simultaneously in lockstep
      const referenceTime = target.currentTimeSeconds ?? 0;
      if (nextPlayState) {
        setLoadingSlots({ 'slot-a': true, 'slot-b': true, 'slot-c': true });
      } else {
        setLoadingSlots({});
      }

      slots.forEach(s => {
        const el = getOrCreateAudioElement(s);
        let effectiveVol = s.volume;
        if (loudnessMatchEnabled && s.lufsTrimDb) {
          const trimFactor = Math.pow(10, s.lufsTrimDb / 20);
          effectiveVol = effectiveVol * trimFactor;
        }
        el.volume = Math.max(0, Math.min(1, effectiveVol * 0.95));
        el.muted = Boolean(activeSoloSlot && activeSoloSlot !== s.id) || s.isMuted;
        el.loop = s.isLooping;
        el.playbackRate = s.playbackRate || 1.0;

        if (nextPlayState) {
          if (syncPlayheads) {
            try { el.currentTime = referenceTime; } catch (_) {}
          }
          const playPromise = el.play();
          if (playPromise) {
            playPromise.then(() => {
              setLoadingSlots(prev => ({ ...prev, [s.id]: false }));
            }).catch(e => {
              console.warn(`Slot ${s.id} sync play note:`, e);
              setLoadingSlots(prev => ({ ...prev, [s.id]: false }));
            });
          }
        } else {
          el.pause();
        }
      });

      setSlots(prev => prev.map(s => ({
        ...s,
        isPlaying: nextPlayState,
        currentTimeSeconds: syncPlayheads ? referenceTime : s.currentTimeSeconds
      })));
      return;
    }

    // Independent playback per track when Sync Playback is OFF
    const el = getOrCreateAudioElement(target);
    let effectiveVol = target.volume;
    if (loudnessMatchEnabled && target.lufsTrimDb) {
      const trimFactor = Math.pow(10, target.lufsTrimDb / 20);
      effectiveVol = effectiveVol * trimFactor;
    }
    el.volume = Math.max(0, Math.min(1, effectiveVol * 0.95));
    el.muted = Boolean(activeSoloSlot && activeSoloSlot !== target.id) || target.isMuted;
    el.loop = target.isLooping;
    el.playbackRate = target.playbackRate || 1.0;

    if (nextPlayState) {
      setLoadingSlots(prev => ({ ...prev, [slotId]: true }));
      const playPromise = el.play();
      if (playPromise) {
        playPromise.then(() => {
          setLoadingSlots(prev => ({ ...prev, [slotId]: false }));
        }).catch(e => {
          console.warn(`Slot ${slotId} play note:`, e);
          setLoadingSlots(prev => ({ ...prev, [slotId]: false }));
        });
      }
    } else {
      el.pause();
      setLoadingSlots(prev => ({ ...prev, [slotId]: false }));
    }

    setSlots(prev => prev.map(s => {
      if (s.id === slotId) {
        return { ...s, isPlaying: nextPlayState };
      }
      return s;
    }));
  };

  // Master Global Play All / Pause All in lockstep
  const handleToggleGlobalPlay = () => {
    ensureAudioGraph();
    const anyPlaying = slots.some(s => s.isPlaying);
    const nextPlayState = !anyPlaying;
    const referenceTime = slots[0]?.currentTimeSeconds ?? 0;

    if (nextPlayState) {
      setLoadingSlots({ 'slot-a': true, 'slot-b': true, 'slot-c': true });
    } else {
      setLoadingSlots({});
    }

    slots.forEach(s => {
      const el = getOrCreateAudioElement(s);
      let effectiveVol = s.volume;
      if (loudnessMatchEnabled && s.lufsTrimDb) {
        const trimFactor = Math.pow(10, s.lufsTrimDb / 20);
        effectiveVol = effectiveVol * trimFactor;
      }
      el.volume = Math.max(0, Math.min(1, effectiveVol * 0.95));
      el.muted = Boolean(activeSoloSlot && activeSoloSlot !== s.id) || s.isMuted;
      el.loop = s.isLooping;
      el.playbackRate = s.playbackRate || 1.0;

      if (nextPlayState) {
        if (syncPlayheads) {
          try { el.currentTime = referenceTime; } catch (_) {}
        }
        const playPromise = el.play();
        if (playPromise) {
          playPromise.then(() => {
            setLoadingSlots(prev => ({ ...prev, [s.id]: false }));
          }).catch(e => {
            console.warn(`Global sync play note for ${s.id}:`, e);
            setLoadingSlots(prev => ({ ...prev, [s.id]: false }));
          });
        }
      } else {
        el.pause();
      }
    });

    setSlots(prev => prev.map(s => ({
      ...s,
      isPlaying: nextPlayState,
      currentTimeSeconds: syncPlayheads ? referenceTime : s.currentTimeSeconds
    })));
  };

  // 1-Click Load Canonical 3-Take Shootout (Master, Vocal, Instrumental)
  const handleLoadStandardTakes = () => {
    const targetTrack: Track = activeTrack || CANONICAL_TRACKS[0];
    const stems = getTrackStems(targetTrack);
    const masterStem = stems.find(s => s.stemType === 'master') || stems[0];
    const vocalStem = stems.find(s => s.stemType === 'vocal' || s.stemType === 'guitar') || stems[1] || masterStem;
    const instStem = stems.find(s => s.stemType === 'drums' || s.stemType === 'organ' || s.stemType === 'piano' || s.stemType === 'bass') || stems[2] || masterStem;

    setSlots(prev => prev.map(s => {
      if (s.id === 'slot-a') {
        return {
          ...s,
          title: masterStem?.name || `${targetTrack.title} Master`,
          fileName: masterStem?.webdavPath?.split('/').pop() || masterStem?.name,
          audioBlobUrl: masterStem?.audioUrl || '',
          versionTag: 'Take A: Master Mix Print'
        };
      } else if (s.id === 'slot-b') {
        return {
          ...s,
          title: vocalStem?.name || `${targetTrack.title} Isolated Vocal`,
          fileName: vocalStem?.webdavPath?.split('/').pop() || vocalStem?.name,
          audioBlobUrl: vocalStem?.audioUrl || '',
          versionTag: 'Take B: Dry Vocal Stem'
        };
      } else {
        return {
          ...s,
          title: instStem?.name || `${targetTrack.title} Instrumental Bed`,
          fileName: instStem?.webdavPath?.split('/').pop() || instStem?.name,
          audioBlobUrl: instStem?.audioUrl || '',
          versionTag: 'Take C: Backing Bed Stem'
        };
      }
    }));
    if (showToast) {
      showToast(`⚡ 1-Click Loaded: Master, Vocal, & Instrumental for "${targetTrack.title}"`, 'success');
    }
  };

  // Rewind a slot to beginning
  const handleRewind = (slotId?: string) => {
    if (slotId) {
      const target = slots.find(s => s.id === slotId);
      if (target) {
        const el = getOrCreateAudioElement(target);
        try { el.currentTime = 0; } catch (_) {}
      }
      setSlots(prev => prev.map(s => s.id === slotId ? { ...s, currentTimeSeconds: 0 } : s));
    } else {
      slots.forEach(s => {
        const el = getOrCreateAudioElement(s);
        try { el.currentTime = 0; } catch (_) {}
      });
      setSlots(prev => prev.map(s => ({ ...s, currentTimeSeconds: 0 })));
    }
  };

  // Seeking on waveform (Click / Drag)
  const handleSeek = (slotId: string, e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRefs[slotId as keyof typeof canvasRefs]?.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const ratio = clickX / rect.width;

    setSlots(prev => {
      const targetSlot = prev.find(s => s.id === slotId);
      const newSec = ratio * (targetSlot?.durationSeconds || 218);

      if (syncPlayheads) {
        // Locked playhead: seek ALL slots synchronously!
        prev.forEach(s => {
          const el = getOrCreateAudioElement(s);
          try { el.currentTime = newSec; } catch (_) {}
        });
        return prev.map(s => ({ ...s, currentTimeSeconds: newSec }));
      } else {
        // Independent seek
        if (targetSlot) {
          const el = getOrCreateAudioElement(targetSlot);
          try { el.currentTime = newSec; } catch (_) {}
        }
        return prev.map(s => s.id === slotId ? { ...s, currentTimeSeconds: newSec } : s);
      }
    });
  };

  // Exclusive Solo Switching (Key feature for critical listening!)
  const handleSoloSlot = (slotId: string) => {
    ensureAudioGraph();
    setActiveSoloSlot(prev => prev === slotId ? null : slotId);
    if (showToast) {
      const target = slots.find(s => s.id === slotId);
      showToast(`Exclusive Solo: ${target?.label || slotId}`, 'info');
    }
  };

  // 1-Click A/B Quick Flip between Take A and Take B
  const handleToggleABFlip = () => {
    ensureAudioGraph();
    setActiveSoloSlot(prev => {
      const next = prev === 'slot-a' ? 'slot-b' : 'slot-a';
      if (showToast) {
        showToast(`⚡ A/B Quick Flip: Auditioning Take ${next === 'slot-a' ? 'A' : 'B'}`, 'info');
      }
      return next;
    });
  };

  // Keyboard Shortcuts for instant A/B/C cross-switching (Keys 1, 2, 3 or A, B, C, F, P, S, L)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.key === '1' || e.key.toLowerCase() === 'a') {
        e.preventDefault();
        handleSoloSlot('slot-a');
      } else if (e.key === '2' || e.key.toLowerCase() === 'b') {
        e.preventDefault();
        handleSoloSlot('slot-b');
      } else if (e.key === '3' || e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handleSoloSlot('slot-c');
      } else if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        handleToggleABFlip();
      } else if (e.code === 'Space') {
        e.preventDefault();
        handleToggleGlobalPlay();
      } else if (e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setSyncPlayback(prev => {
          const next = !prev;
          if (showToast) {
            showToast(next ? 'Sync Playback enabled (HotKey P)' : 'Sync Playback disabled (HotKey P)', 'info');
          }
          return next;
        });
      } else if (e.key.toLowerCase() === 's') {
        e.preventDefault();
        setSyncPlayheads(prev => !prev);
      } else if (e.key.toLowerCase() === 'l') {
        e.preventDefault();
        setLoudnessMatchEnabled(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [slots, activeSoloSlot]);

  // Real Audio File Upload Handler (Browser FileReader + AudioContext decode)
  const handleFileUpload = async (slotId: string, file: File) => {
    if (!file) return;

    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;

      const arrayBuffer = await file.arrayBuffer();
      const decodedBuffer = await ctx.decodeAudioData(arrayBuffer);

      // Extract real peak data from the decoded audio buffer
      const channelData = decodedBuffer.getChannelData(0);
      const totalSamples = channelData.length;
      const bars = 160;
      const blockSize = Math.floor(totalSamples / bars);
      const extractedPeaks: number[] = [];

      for (let i = 0; i < bars; i++) {
        let max = 0;
        const start = i * blockSize;
        for (let j = 0; j < blockSize; j += 4) {
          const val = Math.abs(channelData[start + j] || 0);
          if (val > max) max = val;
        }
        extractedPeaks.push(Math.min(1.0, Math.max(0.08, max)));
      }

      const durationSec = Math.round(decodedBuffer.duration);
      const blobUrl = URL.createObjectURL(file);

      setSlots(prev => prev.map(s => {
        if (s.id === slotId) {
          return {
            ...s,
            title: file.name.replace(/\.[^/.]+$/, ''),
            versionTag: `Custom Upload (${(file.size / (1024 * 1024)).toFixed(1)} MB)`,
            fileName: file.name,
            sourceType: 'upload',
            durationSeconds: durationSec,
            currentTimeSeconds: 0,
            audioBuffer: decodedBuffer,
            audioBlobUrl: blobUrl,
            peakData: extractedPeaks,
            estimatedLufs: -13.8,
            peakDb: -0.4,
            lufsTrimDb: -0.2
          };
        }
        return s;
      }));

      if (showToast) {
        showToast(`Imported ${file.name} into Slot ${slotId.toUpperCase().slice(-1)} with decoded waveform!`, 'success');
      }
    } catch (err: any) {
      console.error('Audio decode error:', err);
      if (showToast) {
        showToast(`Failed to decode audio: ${err.message || 'Unsupported format'}`, 'error');
      }
    }
  };

  // Catalog track selection
  const handleSelectCatalogTrack = (slotId: string, trackId: string) => {
    const track = CANONICAL_TRACKS.find(t => t.id === trackId);
    if (!track) return;

    const catVersions = songVersionsCatalog[trackId]?.versions || [];
    const newVersionTag = catVersions[0]?.versionTag || `${track.title} (Master Take)`;

    setSlots(prev => prev.map(s => {
      if (s.id === slotId) {
        return {
          ...s,
          title: track.title,
          versionTag: newVersionTag,
          genre: track.genre,
          bpm: track.bpm,
          key: track.key,
          sourceType: 'catalog',
          currentTimeSeconds: 0,
          peakData: generateDeterministicPeaks(`${track.title}_${slotId}`, 160)
        };
      }
      return s;
    }));

    if (showToast) {
      showToast(`Assigned ${track.title} to Slot ${slotId.slice(-1).toUpperCase()}`, 'info');
    }
  };

  // Preset Selection
  const handleSelectPreset = (slotId: string, presetName: string) => {
    const presets: { [key: string]: Partial<AudioTrackSlot> } = {
      nashville_master: {
        title: 'The Work Ain’t Done',
        versionTag: 'v6.0 (Nashville Radio Master 24/48)',
        genre: 'Modern Folk-Hop',
        estimatedLufs: -12.4,
        peakDb: -0.2,
        lufsTrimDb: -1.6,
        notes: 'Pristine 24-bit 48kHz radio master print with warm Teletronix LA-2A vocal glue.'
      },
      acoustic_blueprint: {
        title: 'The Work Ain’t Done',
        versionTag: 'v1.0 (Acoustic Nightshift Blueprint)',
        genre: 'Acoustic Blue-Collar',
        estimatedLufs: -18.2,
        peakDb: -2.1,
        lufsTrimDb: +4.2,
        notes: 'Intimate fingerpicked acoustic guitar sketch with vinyl foley.'
      },
      kpop_future_bass: {
        title: 'The Work Ain’t Done',
        versionTag: 'v8.0 (Male K-Pop Future Bass Remix)',
        genre: 'K-Pop Future Bass',
        estimatedLufs: -10.8,
        peakDb: -0.1,
        lufsTrimDb: -3.2,
        notes: 'Heavy 808 drop with wide supersaws and choreography percussion.'
      }
    };

    const target = presets[presetName];
    if (!target) return;

    setSlots(prev => prev.map(s => {
      if (s.id === slotId) {
        return {
          ...s,
          ...target,
          sourceType: 'preset',
          currentTimeSeconds: 0,
          peakData: generateDeterministicPeaks(`${target.title}_${presetName}`, 160)
        };
      }
      return s;
    }));

    if (showToast) {
      showToast(`Loaded preset into Slot ${slotId.slice(-1).toUpperCase()}`, 'info');
    }
  };

  // Toggle Crown Winner
  const handleCrownWinner = (slotId: string) => {
    setSlots(prev => prev.map(s => ({
      ...s,
      isCrownedWinner: s.id === slotId
    })));

    const winner = slots.find(s => s.id === slotId);
    if (showToast) {
      showToast(`👑 Crowned ${winner?.label} (${winner?.versionTag}) as the winning cut!`, 'success');
    }
  };

  // Double-Blind Mode Toggle
  const toggleBlindMode = () => {
    if (!blindModeEnabled) {
      const shuffled = [0, 1, 2].sort(() => Math.random() - 0.5);
      setBlindShuffle(shuffled);
      setBlindRevealed(false);
      setBlindModeEnabled(true);
      if (showToast) showToast('Double-Blind Mode active! Track labels disguised as Alpha, Beta, Gamma.', 'info');
    } else {
      setBlindModeEnabled(false);
      setBlindRevealed(false);
    }
  };

  // Export Evaluation Summary
  const handleExportEvaluation = () => {
    const winner = slots.find(s => s.isCrownedWinner) || slots[0];
    const report = [
      `# 🎧 Critical Listening A/B/C Shootout Evaluation Report`,
      `**Project:** ${activeTrack?.title || 'Sovereign Studio Audio Evaluation'}`,
      `**Date:** ${new Date().toLocaleDateString()} | **Master Target:** -14.0 LUFS\n`,
      `## 🏆 Crowned Master Take`,
      `- **Winner:** ${winner.label}: ${winner.title} (${winner.versionTag})`,
      `- **Genre/BPM/Key:** ${winner.genre} • ${winner.bpm} BPM • ${winner.key}`,
      `- **Loudness:** ${winner.estimatedLufs} LUFS (Peak ${winner.peakDb} dBTP)`,
      `- **Engineering Notes:** ${winner.notes}\n`,
      `## 📊 Comparison Matrix & Scorecards`,
      ...slots.map(s => {
        const total = (Object.values(s.scores) as number[]).reduce((a, b) => a + b, 0);
        return [
          `### ${s.label}: ${s.title} (${s.versionTag})`,
          `- **Total Score:** ${total} / 50 pts`,
          `- Frequency Balance: ${s.scores.frequencyBalance}/10`,
          `- Dynamic Range: ${s.scores.dynamicRange}/10`,
          `- Vocal Clarity: ${s.scores.vocalClarity}/10`,
          `- Low-End Control: ${s.scores.lowEndControl}/10`,
          `- Emotional Impact: ${s.scores.emotionalImpact}/10`,
          `- 🟢 Pros (Mix Strengths): ${s.pros || 'None documented'}`,
          `- 🔴 Cons (Weaknesses & Fixes): ${s.cons || 'None documented'}`,
          `- 📝 Notes & Verdict: ${s.notes || 'None documented'}\n`
        ].join('\n');
      })
    ].join('\n');

    if (navigator.clipboard) {
      navigator.clipboard.writeText(report);
      if (showToast) showToast('Copied full evaluation report to clipboard!', 'success');
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 rounded-xl border border-slate-800 shadow-2xl overflow-hidden">
      {/* 1. Header Toolbar: Global Transport & Synchronized Critical Tools */}
      <div className="bg-slate-900/90 border-b border-slate-800 p-3 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Title & Badge */}
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-indigo-500/20 to-purple-600/30 border border-indigo-500/40 rounded-lg text-indigo-400">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-100">
                  A/B/C Version Comparison
                </h3>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-indigo-950 border border-indigo-700/50 text-indigo-300 font-bold">
                  3-Way Critical Listening
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Import or select three audio tracks side-by-side with independent waveforms, loudness matching, and zero-latency cross-auditioning.
              </p>
            </div>
          </div>

          {/* Master Transport & Listening Mode Toggles */}
          <div className="flex items-center space-x-2 flex-wrap gap-2">
            {/* Global Play / Pause All */}
            <button
              onClick={handleToggleGlobalPlay}
              disabled={isAnySlotLoading}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-md ${
                isAnySlotLoading
                  ? 'bg-amber-500/80 text-slate-950 border border-amber-400 ring-2 ring-amber-400/50 cursor-wait'
                  : slots.some(s => s.isPlaying)
                  ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 cursor-pointer'
                  : 'bg-indigo-600 text-white hover:bg-indigo-500 cursor-pointer'
              }`}
              title={isAnySlotLoading ? 'Buffering Nextcloud audio stream... Please wait' : slots.some(s => s.isPlaying) ? 'Pause All' : 'Play All Sync'}
            >
              {isAnySlotLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-950" />
                  <span>Buffering Stream...</span>
                </>
              ) : slots.some(s => s.isPlaying) ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>Pause All</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Play All Sync</span>
                </>
              )}
            </button>

            {/* Active Buffering Indicator Badge */}
            {isAnySlotLoading && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-mono animate-pulse shadow-xs">
                <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
                <span className="truncate max-w-[200px]">Loading Nextcloud audio...</span>
              </div>
            )}

            {/* Rewind All */}
            <button
              onClick={() => handleRewind()}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
              title="Rewind all tracks to 00:00.0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Playhead Sync Lock */}
            <button
              onClick={() => setSyncPlayheads(!syncPlayheads)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                syncPlayheads
                  ? 'bg-emerald-950/80 border-emerald-600 text-emerald-300 shadow-sm'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
              title="Locked Playheads: Scrubbing any waveform moves all 3 tracks to the exact same timecode."
            >
              {syncPlayheads ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
              <span>Sync Playheads: {syncPlayheads ? 'LOCKED' : 'FREE'}</span>
            </button>

            {/* Sync Playback Toggle */}
            <button
              onClick={() => {
                const nextState = !syncPlayback;
                setSyncPlayback(nextState);
                if (showToast) {
                  showToast(
                    nextState
                      ? 'Sync Playback enabled: starting or pausing any track controls all 3 simultaneously.'
                      : 'Sync Playback disabled: independent playback controls per track.',
                    'info'
                  );
                }
              }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                syncPlayback
                  ? 'bg-amber-950/80 border-amber-500/70 text-amber-300 shadow-sm shadow-amber-950/40'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
              title="Forces all three tracks to start and stop simultaneously for direct critical comparison (Hotkey: P)"
            >
              <FastForward className="w-3.5 h-3.5 text-amber-400" />
              <span>Sync Playback: {syncPlayback ? 'SIMULTANEOUS' : 'INDEPENDENT'}</span>
            </button>

            {/* LUFS Loudness Match (-14.0 LUFS) */}
            <button
              onClick={() => setLoudnessMatchEnabled(!loudnessMatchEnabled)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                loudnessMatchEnabled
                  ? 'bg-indigo-950/80 border-indigo-600 text-indigo-300 shadow-sm'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
              title="Normalizes perceived loudness to -14.0 LUFS to eliminate Fletcher-Munson volume bias."
            >
              <Activity className="w-3.5 h-3.5" />
              <span>LUFS Match: {loudnessMatchEnabled ? 'ON (-14)' : 'RAW'}</span>
            </button>

            {/* Double Blind Mode */}
            <button
              onClick={toggleBlindMode}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                blindModeEnabled
                  ? 'bg-purple-950/80 border-purple-500 text-purple-300 shadow-sm'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
              title="Shuffles and disguises track titles as Alpha, Beta, Gamma to eliminate brand and take bias."
            >
              {blindModeEnabled ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>Blind Test: {blindModeEnabled ? 'ACTIVE' : 'OFF'}</span>
            </button>

            {blindModeEnabled && (
              <button
                onClick={() => setBlindRevealed(!blindRevealed)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200"
              >
                {blindRevealed ? 'Hide Identities' : 'Reveal Identities'}
              </button>
            )}

            {/* Export Evaluation Report */}
            <button
              onClick={handleExportEvaluation}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 shadow-sm"
              title="Copy critical listening scorecard & summary to clipboard"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Export Report</span>
            </button>
          </div>
        </div>

        {/* 2. Instant A/B/C Solo Cross-Switcher Bar & Section Cue Looper */}
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          {/* Quick Exclusive Solo Buttons */}
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
              Instant Audition:
            </span>
            {slots.map((slot, idx) => {
              const actualIdx = blindModeEnabled ? blindShuffle[idx] : idx;
              const targetSlot = slots[actualIdx];
              const isSolo = activeSoloSlot === targetSlot.id;
              const letter = targetSlot.slotLetter;
              const displayLabel = blindModeEnabled && !blindRevealed
                ? `Take ${['Alpha', 'Beta', 'Gamma'][idx]}`
                : `Take ${letter}`;

              return (
                <button
                  key={targetSlot.id}
                  onClick={() => handleSoloSlot(targetSlot.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition border cursor-pointer ${
                    isSolo
                      ? `${targetSlot.colorScheme.bg} ${targetSlot.colorScheme.border} ${targetSlot.colorScheme.primary} shadow-md ring-1 ring-current`
                      : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                  title={loadingSlots[targetSlot.id] ? 'Buffering Nextcloud audio...' : `Audition ${displayLabel}`}
                >
                  {loadingSlots[targetSlot.id] ? (
                    <Loader2 className="w-2.5 h-2.5 animate-spin text-amber-400" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-current"></span>
                  )}
                  <span>{displayLabel}</span>
                  <span className="text-[9px] px-1 py-0.2 rounded bg-black/30 font-mono">
                    [{idx + 1}]
                  </span>
                </button>
              );
            })}
            {activeSoloSlot && (
              <button
                onClick={() => setActiveSoloSlot(null)}
                className="text-[11px] text-slate-400 hover:text-slate-200 underline ml-1 cursor-pointer"
              >
                Clear Solo
              </button>
            )}

            {/* 1-Click A/B Quick Flip Button */}
            <button
              type="button"
              onClick={handleToggleABFlip}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition bg-gradient-to-r from-amber-600 to-cyan-600 hover:from-amber-500 hover:to-cyan-500 text-white shadow-sm border border-amber-400/40 cursor-pointer ml-1"
              title="Instantly flip audition between Take A and Take B with zero clicks/latency (Hotkey: F)"
            >
              <Zap className="w-3.5 h-3.5 fill-current text-amber-200" />
              <span>A/B Flip [F]</span>
            </button>
          </div>

          {/* Section Cue Selector */}
          <div className="flex items-center space-x-1 text-xs">
            <span className="text-slate-400 font-medium mr-1 flex items-center gap-1">
              <Layers className="w-3 h-3 text-indigo-400" /> Loop Section:
            </span>
            {(['full', 'intro', 'verse1', 'chorus1', 'bridge', 'outro'] as const).map(sec => (
              <button
                key={sec}
                onClick={() => setActiveSectionRange(sec)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium border transition cursor-pointer ${
                  activeSectionRange === sec
                    ? 'bg-indigo-600 text-white border-indigo-400 font-bold'
                    : 'bg-slate-800/60 hover:bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {sec === 'full' ? 'Full Song' : sec === 'verse1' ? 'Verse 1' : sec === 'chorus1' ? 'Chorus' : sec.charAt(0).toUpperCase() + sec.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleLoadStandardTakes}
              className="px-2.5 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600/40 hover:border-emerald-500 text-emerald-300 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer shadow-xs"
              title="1-Click: Automatically load Master into Take A, Isolated Vocal into Take B, and Instrumental Bed into Take C"
            >
              <Zap className="w-3 h-3 text-amber-300" />
              <span>Auto-Map Takes A/B/C</span>
            </button>

            <div className="text-[11px] text-slate-400 font-mono hidden lg:flex items-center space-x-2">
              <span>Hotkeys:</span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-bold">1</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-bold">2</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-bold">3</kbd>
              <span>Solo Take</span>
              <span className="text-slate-600">|</span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-amber-300 font-bold">F</kbd>
              <span>A/B Flip</span>
              <span className="text-slate-600">|</span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-bold">Space</kbd>
              <span>Play/Pause</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Three Audio Tracks Side-by-Side Channels */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 overflow-y-auto">
        {slots.map((slot, colIdx) => {
          const actualIdx = blindModeEnabled ? blindShuffle[colIdx] : colIdx;
          const displaySlot = slots[actualIdx];
          const isSoloActive = activeSoloSlot === displaySlot.id;
          const isMutedBySolo = activeSoloSlot !== null && activeSoloSlot !== displaySlot.id;
          const letter = displaySlot.slotLetter;

          const titleDisplay = blindModeEnabled && !blindRevealed
            ? `Take ${['Alpha', 'Beta', 'Gamma'][colIdx]} (Blind Test)`
            : displaySlot.title;

          const versionDisplay = blindModeEnabled && !blindRevealed
            ? 'Disguised Master Take'
            : displaySlot.versionTag;

          return (
            <div
              key={displaySlot.id}
              className={`flex flex-col rounded-xl border transition-all duration-200 overflow-hidden shadow-lg ${
                isSoloActive
                  ? `${displaySlot.colorScheme.border} ring-2 ring-indigo-500/50 bg-slate-900/95`
                  : isMutedBySolo
                  ? 'border-slate-800/60 bg-slate-950/60 opacity-60'
                  : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
              }`}
            >
              {/* Channel Strip Header */}
              <div className={`p-3 border-b border-slate-800 flex items-center justify-between ${displaySlot.colorScheme.bg}`}>
                <div className="flex items-center space-x-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (!loadingSlots[displaySlot.id]) {
                        handleTogglePlay(displaySlot.id);
                      }
                    }}
                    disabled={loadingSlots[displaySlot.id]}
                    className={`w-8 h-8 rounded-lg font-bold text-xs flex items-center justify-center font-mono shadow-sm transition group cursor-pointer border ${
                      loadingSlots[displaySlot.id]
                        ? 'bg-amber-500/20 text-amber-300 border-amber-400 ring-2 ring-amber-400/50 cursor-wait'
                        : displaySlot.isPlaying
                        ? 'bg-amber-500 text-slate-950 border-amber-400 ring-2 ring-amber-400/50 shadow-md'
                        : isSoloActive
                        ? 'bg-indigo-600 text-white border-indigo-400'
                        : 'bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white border-slate-700'
                    }`}
                    title={
                      loadingSlots[displaySlot.id]
                        ? `Buffering Nextcloud audio for Take ${letter}... Please wait`
                        : displaySlot.isPlaying
                        ? `Pause Take ${letter} [Space]`
                        : `Play / Audition Take ${letter} [Click icon or Space]`
                    }
                  >
                    {loadingSlots[displaySlot.id] ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                    ) : displaySlot.isPlaying ? (
                      <Pause className="w-3.5 h-3.5 fill-current" />
                    ) : (
                      <>
                        <span className="group-hover:hidden">{letter}</span>
                        <Play className="w-3.5 h-3.5 fill-current hidden group-hover:block ml-0.5" />
                      </>
                    )}
                  </button>
                  <div>
                    <h4 className="text-xs font-bold text-slate-100 truncate max-w-[190px]">
                      {titleDisplay}
                    </h4>
                    <p className="text-[10px] text-slate-400 truncate max-w-[190px]">
                      {versionDisplay}
                    </p>
                  </div>
                </div>

                {/* Crown Winning Version Indicator */}
                <button
                  onClick={() => handleCrownWinner(displaySlot.id)}
                  className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 border ${
                    displaySlot.isCrownedWinner
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                      : 'bg-slate-800/80 hover:bg-slate-800 text-slate-400 border-slate-700 hover:text-amber-300'
                  }`}
                  title="Crown this track as the winning master take"
                >
                  <Trophy className="w-3.5 h-3.5 fill-current" />
                  <span className="text-[10px]">{displaySlot.isCrownedWinner ? 'Winner' : 'Vote'}</span>
                </button>
              </div>

              {/* Source Selection & File Upload Strip */}
              <div className="p-2.5 bg-slate-950/70 border-b border-slate-800/80 space-y-2 text-xs">
                {/* 1-Click Suno Multi-Take Live Stream Loader (372 Generations) */}
                  <div>
                    <select
                      value={displaySlot.sourceType === 'suno' ? displaySlot.audioBlobUrl : ''}
                      onChange={(e) => {
                        const selectedUrl = e.target.value;
                        if (!selectedUrl) return;
                        const sunoTrack = SUNO_MASTER_TRACKS.find(st => st.streamUrl === selectedUrl);
                        if (!sunoTrack) return;
                        setSlots(prev => prev.map(s => {
                          if (s.id === displaySlot.id) {
                            return {
                              ...s,
                              title: sunoTrack.title,
                              versionTag: `Suno (${sunoTrack.model}): ${sunoTrack.tags ? sunoTrack.tags.slice(0, 32) + '...' : 'Take'}`,
                              fileName: `${sunoTrack.id}.m4a`,
                              audioBlobUrl: sunoTrack.streamUrl,
                              sourceType: 'suno',
                              durationSeconds: Math.round(sunoTrack.duration) || 218,
                              currentTimeSeconds: 0,
                              peakData: generateDeterministicPeaks(`${sunoTrack.title}_${sunoTrack.id}`, 160)
                            };
                          }
                          return s;
                        }));
                        if (showToast) {
                          showToast(`Loaded Suno Take "${sunoTrack.title}" (${sunoTrack.model}) into Take ${letter}`, 'success');
                        }
                      }}
                      className="w-full bg-slate-900/90 border border-amber-500/40 hover:border-amber-400 rounded-lg px-2.5 py-1 text-[11px] font-mono text-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-400 truncate cursor-pointer"
                      title="1-Click Direct Suno CloudFront Multi-Take Stream Loader (372 Harvested Generations)"
                    >
                      <option value="">Suno CloudFront Takes (Grouped by Song & Revision)...</option>
                      {/* Active song priority optgroup */}
                      {(() => {
                        const activeRevSong = RELATIONAL_SUNO_CATALOG.find(s => s.id === (activeTrack?.id || 'TRK-01') || s.title.toLowerCase() === (activeTrack?.title || '').toLowerCase());
                        if (activeRevSong && activeRevSong.revisions.length > 0) {
                          return (
                            <optgroup label={`Current Song: ${activeRevSong.title} (${activeRevSong.revisions.length} takes)`}>
                              {activeRevSong.revisions.map(st => (
                                <option key={st.sunoClipId} value={st.streamUrl}>
                                  ⭐ {st.title} [{st.model}] ({st.durationSeconds}s)
                                </option>
                              ))}
                            </optgroup>
                          );
                        }
                        return null;
                      })()}
                      {/* Grouped by canonical songs */}
                      {RELATIONAL_SUNO_CATALOG.map(song => (
                        <optgroup key={song.id} label={`${song.id}: ${song.title} (${song.revisionCount} takes)`}>
                          {song.revisions.map(st => (
                            <option key={st.sunoClipId} value={st.streamUrl}>
                              {st.title} [{st.model}] ({st.durationSeconds}s)
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>

                  {/* 1-Click Nextcloud Stems & Audio Dropdown */}
                {availableNextcloudAudioAssets.length > 0 && (
                  <div>
                    <select
                      value={displaySlot.audioBlobUrl || ''}
                      onChange={(e) => {
                        const selectedUrl = e.target.value;
                        if (!selectedUrl) return;
                        const asset = availableNextcloudAudioAssets.find(a => a.audioUrl === selectedUrl);
                        setSlots(prev => prev.map(s => {
                          if (s.id === displaySlot.id) {
                            return {
                              ...s,
                              title: asset?.filename.replace(/\.[^/.]+$/, '') || s.title,
                              versionTag: `Nextcloud: ${asset?.category || 'Stream'}`,
                              fileName: asset?.filename,
                              audioBlobUrl: selectedUrl,
                              sourceType: 'webdav',
                              currentTimeSeconds: 0
                            };
                          }
                          return s;
                        }));
                        if (showToast) {
                          showToast(`Loaded "${asset?.filename}" into Take ${letter}`, 'success');
                        }
                      }}
                      className="w-full bg-slate-900/90 border border-indigo-500/40 hover:border-indigo-400 rounded-lg px-2.5 py-1 text-[11px] font-mono text-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-400 truncate cursor-pointer"
                      title="1-Click Nextcloud Stems & Masters Loader"
                    >
                      <option value="">Nextcloud Stems & Masters ({availableNextcloudAudioAssets.length} found)...</option>
                      {availableNextcloudAudioAssets.map(asset => (
                        <option key={asset.id} value={asset.audioUrl}>
                          {asset.filename} ({asset.category.replace('_', ' ')})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex items-center justify-between gap-2">
                  {/* Catalog Select */}
                  <div className="flex-1 min-w-0">
                    <select
                      disabled={blindModeEnabled && !blindRevealed}
                      onChange={(e) => handleSelectCatalogTrack(displaySlot.id, e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[11px] text-slate-300 focus:outline-none focus:border-indigo-500 truncate cursor-pointer disabled:opacity-50"
                    >
                      <option value="">Select Catalog Song...</option>
                      {CANONICAL_TRACKS.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.id}: {t.title} ({t.genre})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Upload Local Audio File Button */}
                  <div>
                    <input
                      type="file"
                      ref={fileInputRefs[displaySlot.id as keyof typeof fileInputRefs]}
                      accept="audio/*,.wav,.mp3,.m4a,.flac,.ogg"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(displaySlot.id, file);
                      }}
                    />
                    <button
                      onClick={() => fileInputRefs[displaySlot.id as keyof typeof fileInputRefs]?.current?.click()}
                      className="flex items-center space-x-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] whitespace-nowrap cursor-pointer"
                      title="Upload WAV, MP3, or FLAC file for decoding"
                    >
                      <Upload className="w-3 h-3 text-indigo-400" />
                      <span>Upload</span>
                    </button>
                  </div>

                  {/* Presets Menu */}
                  <select
                    onChange={(e) => handleSelectPreset(displaySlot.id, e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[11px] text-slate-300 focus:outline-none cursor-pointer"
                  >
                    <option value="">Presets</option>
                    <option value="nashville_master">Nashville 24/48</option>
                    <option value="kpop_future_bass">K-Pop Future Bass</option>
                    <option value="acoustic_blueprint">Acoustic Blueprint</option>
                  </select>
                </div>

                {/* Active Stream Indicator */}
                {displaySlot.fileName && (
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 bg-slate-900/60 px-2 py-1 rounded border border-slate-800/60">
                    <span className="flex items-center gap-1.5 truncate">
                      <span className={`w-1.5 h-1.5 rounded-full ${displaySlot.isPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                      <span className="text-slate-500">STREAM:</span>
                      <span className="text-slate-300 truncate" title={displaySlot.fileName}>{displaySlot.fileName}</span>
                    </span>
                    <span className="text-indigo-400 shrink-0 font-bold">24-Bit WebDAV</span>
                  </div>
                )}
              </div>

              {/* Dedicated Waveform Visualizer */}
              <div className="p-3 bg-slate-950/90 border-b border-slate-800 relative">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1.5">
                  <span className="flex items-center gap-1">
                    <Activity className={`w-3 h-3 ${displaySlot.colorScheme.primary}`} />
                    <span>Waveform Peak Profile</span>
                  </span>
                  <span>
                    <strong className="text-slate-200 font-bold">{formatTimecode(displaySlot.currentTimeSeconds)}</strong> / {formatTimecode(displaySlot.durationSeconds)}
                  </span>
                </div>

                {/* Canvas Waveform */}
                <div className="relative rounded-lg overflow-hidden border border-slate-800 bg-slate-950 cursor-pointer shadow-inner">
                  <canvas
                    ref={canvasRefs[displaySlot.id as keyof typeof canvasRefs]}
                    width={400}
                    height={90}
                    onClick={(e) => handleSeek(displaySlot.id, e)}
                    className="w-full h-[90px] block"
                  />
                  {/* Subtle Timecode Markers */}
                  <div className="absolute bottom-1 left-2 text-[9px] font-mono text-slate-600 pointer-events-none">
                    00:00.0
                  </div>
                  <div className="absolute bottom-1 right-2 text-[9px] font-mono text-slate-600 pointer-events-none">
                    {formatTimecode(displaySlot.durationSeconds)}
                  </div>
                </div>

                {/* Acoustic & Loudness Ribbon */}
                <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-slate-400 px-1">
                  <span>Integrated: <strong className="text-slate-200">{displaySlot.estimatedLufs} LUFS</strong></span>
                  <span>Peak: <strong className="text-slate-200">{displaySlot.peakDb} dBTP</strong></span>
                  <span className={displaySlot.lufsTrimDb >= 0 ? 'text-amber-400' : 'text-purple-400'}>
                    Trim: <strong>{displaySlot.lufsTrimDb >= 0 ? `+${displaySlot.lufsTrimDb}` : displaySlot.lufsTrimDb} dB</strong>
                  </span>
                </div>
              </div>

              {/* Independent Playback Controls */}
              <div className="p-3 bg-slate-900 border-b border-slate-800/80 space-y-3">
                {/* Primary Transport Row */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-1.5">
                    {/* Play/Pause */}
                    <button
                      onClick={() => handleTogglePlay(displaySlot.id)}
                      className={`p-2 rounded-full font-bold flex items-center justify-center transition shadow-md ${
                        displaySlot.isPlaying
                          ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                          : 'bg-indigo-600 text-white hover:bg-indigo-500'
                      }`}
                      title={
                        syncPlayback
                          ? (displaySlot.isPlaying ? 'Sync Playback: Pause all 3 tracks simultaneously' : 'Sync Playback: Start all 3 tracks simultaneously in lockstep')
                          : (displaySlot.isPlaying ? 'Pause this track' : 'Play this track')
                      }
                    >
                      {displaySlot.isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                    </button>
                    {syncPlayback && (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-500/40 text-amber-300 font-bold" title="Sync Playback active: this channel starts/stops all 3 tracks simultaneously">
                        SYNC
                      </span>
                    )}

                    {/* Rewind */}
                    <button
                      onClick={() => handleRewind(displaySlot.id)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                      title="Rewind to start"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>

                    {/* Loop Toggle */}
                    <button
                      onClick={() => {
                        setSlots(prev => prev.map(s => s.id === displaySlot.id ? { ...s, isLooping: !s.isLooping } : s));
                      }}
                      className={`p-1.5 rounded-lg border text-xs font-semibold transition ${
                        displaySlot.isLooping
                          ? 'bg-indigo-950 border-indigo-600 text-indigo-300'
                          : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                      title="Toggle infinite loop"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Solo & Mute Buttons */}
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => handleSoloSlot(displaySlot.id)}
                      className={`px-2.5 py-1 rounded text-xs font-bold transition border ${
                        isSoloActive
                          ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-sm'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                      }`}
                      title="Solo this track"
                    >
                      S
                    </button>
                    <button
                      onClick={() => {
                        setSlots(prev => prev.map(s => s.id === displaySlot.id ? { ...s, isMuted: !s.isMuted } : s));
                      }}
                      className={`px-2.5 py-1 rounded text-xs font-bold transition border ${
                        displaySlot.isMuted
                          ? 'bg-red-600 text-white border-red-500 font-black shadow-sm'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                      }`}
                      title="Mute this track"
                    >
                      M
                    </button>
                  </div>
                </div>

                {/* Volume Fader & Stereo Pan */}
                <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
                  {/* Volume Slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Gain:</span>
                      <span className="font-mono text-slate-200">{volumeToDb(displaySlot.volume)}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1.5"
                      step="0.02"
                      value={displaySlot.volume}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setSlots(prev => prev.map(s => s.id === displaySlot.id ? { ...s, volume: val } : s));
                      }}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>

                  {/* Stereo Pan Slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Pan:</span>
                      <span className="font-mono text-slate-200">
                        {displaySlot.pan === 0 ? 'C' : displaySlot.pan < 0 ? `${Math.round(Math.abs(displaySlot.pan) * 100)}% L` : `${Math.round(displaySlot.pan * 100)}% R`}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-1"
                      max="1"
                      step="0.05"
                      value={displaySlot.pan}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setSlots(prev => prev.map(s => s.id === displaySlot.id ? { ...s, pan: val } : s));
                      }}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                  </div>
                </div>

                {/* Speed Selector */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                  <span>Speed:</span>
                  <div className="flex space-x-1">
                    {[0.75, 1.0, 1.25, 1.5].map(rate => (
                      <button
                        key={rate}
                        onClick={() => {
                          setSlots(prev => prev.map(s => s.id === displaySlot.id ? { ...s, playbackRate: rate } : s));
                        }}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${
                          displaySlot.playbackRate === rate
                            ? 'bg-indigo-600 text-white border-indigo-500 font-bold'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Critical Listening Evaluation Scorecard */}
              <div className="p-3 bg-slate-950/60 space-y-2.5 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-300 flex items-center gap-1">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" /> Evaluation Rubric
                    </span>
                    <span className="font-mono font-bold text-amber-400 bg-amber-950/40 border border-amber-500/30 px-2 py-0.5 rounded text-[11px]">
                      {(Object.values(displaySlot.scores) as number[]).reduce((a, b) => a + b, 0)} / 50 pts
                    </span>
                  </div>

                  {/* 1. Frequency Balance */}
                  <div className="space-y-0.5">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Frequency Balance (Sub to Air):</span>
                      <span className="font-mono text-indigo-400">{displaySlot.scores.frequencyBalance}/10</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={displaySlot.scores.frequencyBalance}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setSlots(prev => prev.map(s => s.id === displaySlot.id ? {
                          ...s,
                          scores: { ...s.scores, frequencyBalance: val }
                        } : s));
                      }}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>

                  {/* 2. Dynamic Range & Punch */}
                  <div className="space-y-0.5">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Dynamic Range & Transient Punch:</span>
                      <span className="font-mono text-cyan-400">{displaySlot.scores.dynamicRange}/10</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={displaySlot.scores.dynamicRange}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setSlots(prev => prev.map(s => s.id === displaySlot.id ? {
                          ...s,
                          scores: { ...s.scores, dynamicRange: val }
                        } : s));
                      }}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                  </div>

                  {/* 3. Vocal Cut & Clarity */}
                  <div className="space-y-0.5">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Vocal Clarity & Pocket:</span>
                      <span className="font-mono text-purple-400">{displaySlot.scores.vocalClarity}/10</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={displaySlot.scores.vocalClarity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setSlots(prev => prev.map(s => s.id === displaySlot.id ? {
                          ...s,
                          scores: { ...s.scores, vocalClarity: val }
                        } : s));
                      }}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                    />
                  </div>

                  {/* 4. Low-End Control */}
                  <div className="space-y-0.5">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Low-End Control (Mud-Free):</span>
                      <span className="font-mono text-emerald-400">{displaySlot.scores.lowEndControl}/10</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={displaySlot.scores.lowEndControl}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setSlots(prev => prev.map(s => s.id === displaySlot.id ? {
                          ...s,
                          scores: { ...s.scores, lowEndControl: val }
                        } : s));
                      }}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                  </div>

                  {/* 5. Emotional Impact */}
                  <div className="space-y-0.5">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Overall Translation & Impact:</span>
                      <span className="font-mono text-amber-400">{displaySlot.scores.emotionalImpact}/10</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={displaySlot.scores.emotionalImpact}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setSlots(prev => prev.map(s => s.id === displaySlot.id ? {
                          ...s,
                          scores: { ...s.scores, emotionalImpact: val }
                        } : s));
                      }}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                  </div>
                </div>

                {/* Dedicated Evaluation Notes (Pros & Cons) */}
                <div className="pt-2.5 border-t border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-200 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Evaluation Notes & Observations</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Take {letter}
                    </span>
                  </div>

                  {/* Pros (Mix Strengths) */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-emerald-400 flex items-center gap-1">
                        <ThumbsUp className="w-3 h-3" />
                        <span>Pros (Mix Strengths)</span>
                      </span>
                      <span className="text-[9px] text-slate-500 font-mono">What works well</span>
                    </div>
                    <textarea
                      rows={2}
                      value={displaySlot.pros}
                      onChange={(e) => {
                        const text = e.target.value;
                        setSlots(prev => prev.map(s => s.id === displaySlot.id ? { ...s, pros: text } : s));
                      }}
                      placeholder="Document pros (e.g. Crisp vocal air, tight punchy 808 transient, wide acoustic stereo spread)..."
                      className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500/70 rounded p-1.5 text-[11px] text-slate-200 placeholder-slate-500 focus:outline-none resize-none leading-relaxed transition"
                    />
                    {/* Quick Pro Tag Pills */}
                    <div className="flex items-center gap-1 flex-wrap pt-0.5">
                      {['Vocal Clarity', 'Punchy 808', 'Wide Stereo', 'Warm Tone', 'Dynamic Lift'].map(tag => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            setSlots(prev => prev.map(s => {
                              if (s.id === displaySlot.id) {
                                const updated = s.pros ? `${s.pros.trim()}, ${tag.toLowerCase()}` : tag;
                                return { ...s, pros: updated };
                              }
                              return s;
                            }));
                          }}
                          className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950/50 text-emerald-300 border border-emerald-800/40 hover:bg-emerald-900/60 transition cursor-pointer"
                        >
                          + {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Cons (Drawbacks & Fixes) */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-rose-400 flex items-center gap-1">
                        <ThumbsDown className="w-3 h-3" />
                        <span>Cons (Drawbacks & Fixes)</span>
                      </span>
                      <span className="text-[9px] text-slate-500 font-mono">What needs work</span>
                    </div>
                    <textarea
                      rows={2}
                      value={displaySlot.cons}
                      onChange={(e) => {
                        const text = e.target.value;
                        setSlots(prev => prev.map(s => s.id === displaySlot.id ? { ...s, cons: text } : s));
                      }}
                      placeholder="Document cons (e.g. Harsh high-frequency sibilance, muddy 200Hz resonance, weak drum presence)..."
                      className="w-full bg-slate-900 border border-slate-800 focus:border-rose-500/70 rounded p-1.5 text-[11px] text-slate-200 placeholder-slate-500 focus:outline-none resize-none leading-relaxed transition"
                    />
                    {/* Quick Con Tag Pills */}
                    <div className="flex items-center gap-1 flex-wrap pt-0.5">
                      {['Harsh Treble', 'Boxy Mids', 'Muddy Bass', 'Vocal Sibilance', 'Ear Fatigue'].map(tag => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            setSlots(prev => prev.map(s => {
                              if (s.id === displaySlot.id) {
                                const updated = s.cons ? `${s.cons.trim()}, ${tag.toLowerCase()}` : tag;
                                return { ...s, cons: updated };
                              }
                              return s;
                            }));
                          }}
                          className="text-[9px] px-1.5 py-0.5 rounded bg-rose-950/50 text-rose-300 border border-rose-800/40 hover:bg-rose-900/60 transition cursor-pointer"
                        >
                          - {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* General Engineering Notes & Directives */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-300 flex items-center gap-1">
                        <FileText className="w-3 h-3 text-indigo-400" />
                        <span>General Notes & Verdict</span>
                      </span>
                    </div>
                    <textarea
                      rows={2}
                      value={displaySlot.notes}
                      onChange={(e) => {
                        const text = e.target.value;
                        setSlots(prev => prev.map(s => s.id === displaySlot.id ? { ...s, notes: text } : s));
                      }}
                      placeholder="Overall engineering verdict, recommended use case, or stem revision directives..."
                      className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-[11px] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none transition"
                    />
                  </div>

                  <button
                    onClick={() => handleCrownWinner(displaySlot.id)}
                    className={`w-full py-2 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition ${
                      displaySlot.isCrownedWinner
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                    }`}
                  >
                    <Trophy className="w-3.5 h-3.5" />
                    <span>{displaySlot.isCrownedWinner ? '👑 Crowned Best Version' : `Pick ${letter} as Best Version`}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Bottom Verdict Bar */}
      <div className="bg-slate-900/90 border-t border-slate-800 p-3 px-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5">
            <span className="font-bold text-slate-200">Current Winner:</span>
            {slots.find(s => s.isCrownedWinner) ? (
              <span className="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-600/50 text-amber-300 font-bold font-mono">
                👑 {slots.find(s => s.isCrownedWinner)?.label} ({slots.find(s => s.isCrownedWinner)?.versionTag})
              </span>
            ) : (
              <span className="text-slate-400 italic">No winner selected yet</span>
            )}
          </div>
          <span className="text-slate-600 hidden md:inline">|</span>
          <span className="text-slate-400 hidden md:inline">
            Use keys <kbd className="px-1 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-bold">1</kbd>, <kbd className="px-1 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-bold">2</kbd>, <kbd className="px-1 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-bold">3</kbd> for instant zero-latency cross-auditioning.
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {onNavigateToTab && (
            <button
              onClick={() => onNavigateToTab('mastering')}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium transition"
            >
              Open in Mastering Suite
            </button>
          )}
          {onNavigateToTab && (
            <button
              onClick={() => onNavigateToTab('mixer')}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition shadow-md"
            >
              Send to Mini-DAW Console
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
