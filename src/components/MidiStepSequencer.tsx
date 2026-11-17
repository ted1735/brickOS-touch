import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Square,
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  Sliders,
  ChevronDown,
  Layers,
  Radio,
  Zap,
  Music,
  Check,
  Disc,
  X
} from 'lucide-react';
import { audioMiniDaw } from '../utils/audioEngine';

export type DrumVoiceId = 'kick' | 'snare' | 'hihat' | 'openhat' | 'clap' | 'rimshot' | 'tom' | 'shaker';

export interface DrumTrackConfig {
  id: DrumVoiceId;
  name: string;
  shortName: string;
  color: string;
  activeColor: string;
  volume: number; // 0 to 1
  isMuted: boolean;
  isSolo: boolean;
  // 16 steps: 0 = off, 1 = normal (1.0), 2 = accent (1.4), 3 = ghost (0.5)
  steps: number[];
}

export interface MidiStepSequencerProps {
  initialBpm?: number;
  isDawPlaying?: boolean;
  onClose?: () => void;
  isDarkMode?: boolean;
}

const DEFAULT_PRESETS: Record<string, { name: string; description: string; pattern: Record<DrumVoiceId, number[]> }> = {
  nashville_acoustic: {
    name: 'Nashville 4-on-Floor',
    description: 'Steady kick on quarters, acoustic snare backbeat on 2 & 4, shaker groove & 8th-note closed hats',
    pattern: {
      kick:    [2, 0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 1, 0, 0, 0],
      snare:   [0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0],
      hihat:   [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
      openhat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
      clap:    [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
      rimshot: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      tom:     [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2],
      shaker:  [1, 3, 1, 3, 1, 3, 1, 3, 1, 3, 1, 3, 1, 3, 1, 3]
    }
  },
  country_rock: {
    name: 'Country Rock Backbeat',
    description: 'Driving syncopated kick with heavy snare on 2 & 4, open hat sizzle on off-beats',
    pattern: {
      kick:    [2, 0, 0, 1, 0, 0, 1, 0, 2, 0, 0, 1, 0, 0, 1, 0],
      snare:   [0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 1],
      hihat:   [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      openhat: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 2, 0],
      clap:    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      rimshot: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      tom:     [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 2],
      shaker:  [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0]
    }
  },
  gospel_shout: {
    name: 'Gospel Shout & Praise',
    description: 'High energy praise rhythm, driving syncopated double kicks, handclaps on 2 & 4, continuous shaker',
    pattern: {
      kick:    [2, 0, 1, 0, 0, 0, 2, 0, 1, 0, 2, 0, 0, 0, 2, 0],
      snare:   [0, 0, 0, 0, 2, 0, 0, 1, 0, 0, 0, 0, 2, 0, 0, 1],
      hihat:   [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      openhat: [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0],
      clap:    [0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0],
      rimshot: [0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0],
      tom:     [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 0, 0],
      shaker:  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    }
  },
  acoustic_folk: {
    name: 'Acoustic Folk Shaker & Rim',
    description: 'Subtle heartbeat kick, crisp wooden rimshot, organic shaker bed with ghost notes',
    pattern: {
      kick:    [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0],
      snare:   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      hihat:   [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
      openhat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      clap:    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      rimshot: [0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0],
      tom:     [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      shaker:  [2, 3, 1, 3, 2, 3, 1, 3, 2, 3, 1, 3, 2, 3, 1, 3]
    }
  },
  trap_hihat_roll: {
    name: 'Modern Trap & 808 Rolls',
    description: 'Deep punchy kick, snappy layered claps/snare, rapid 16th rolling hi-hats with accent rolls',
    pattern: {
      kick:    [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0],
      snare:   [0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0],
      hihat:   [2, 1, 2, 1, 2, 1, 3, 3, 2, 1, 2, 1, 3, 3, 3, 3],
      openhat: [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
      clap:    [0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0],
      rimshot: [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0],
      tom:     [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      shaker:  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    }
  },
  lofi_soul: {
    name: 'Lo-Fi Soul & Neo-Gospel',
    description: 'Laid back unhurried groove, gentle ghost snare hits, warm rim and acoustic shaker',
    pattern: {
      kick:    [2, 0, 0, 0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 0, 0],
      snare:   [0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 3],
      hihat:   [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
      openhat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
      clap:    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      rimshot: [0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0],
      tom:     [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      shaker:  [1, 3, 1, 3, 1, 3, 1, 3, 1, 3, 1, 3, 1, 3, 1, 3]
    }
  }
};

const INITIAL_DRUM_TRACKS: DrumTrackConfig[] = [
  {
    id: 'kick',
    name: 'Kick Drum',
    shortName: 'KICK',
    color: 'emerald',
    activeColor: 'bg-emerald-500 shadow-emerald-500/50 text-slate-950',
    volume: 0.9,
    isMuted: false,
    isSolo: false,
    steps: [...DEFAULT_PRESETS.nashville_acoustic.pattern.kick]
  },
  {
    id: 'snare',
    name: 'Snare Drum',
    shortName: 'SNAR',
    color: 'amber',
    activeColor: 'bg-amber-400 shadow-amber-400/50 text-slate-950',
    volume: 0.85,
    isMuted: false,
    isSolo: false,
    steps: [...DEFAULT_PRESETS.nashville_acoustic.pattern.snare]
  },
  {
    id: 'hihat',
    name: 'Closed Hi-Hat',
    shortName: 'HAT',
    color: 'cyan',
    activeColor: 'bg-cyan-400 shadow-cyan-400/50 text-slate-950',
    volume: 0.75,
    isMuted: false,
    isSolo: false,
    steps: [...DEFAULT_PRESETS.nashville_acoustic.pattern.hihat]
  },
  {
    id: 'openhat',
    name: 'Open Hi-Hat',
    shortName: 'OP-HAT',
    color: 'sky',
    activeColor: 'bg-sky-400 shadow-sky-400/50 text-slate-950',
    volume: 0.7,
    isMuted: false,
    isSolo: false,
    steps: [...DEFAULT_PRESETS.nashville_acoustic.pattern.openhat]
  },
  {
    id: 'clap',
    name: 'Studio Handclap',
    shortName: 'CLAP',
    color: 'purple',
    activeColor: 'bg-purple-400 shadow-purple-400/50 text-slate-950',
    volume: 0.8,
    isMuted: false,
    isSolo: false,
    steps: [...DEFAULT_PRESETS.nashville_acoustic.pattern.clap]
  },
  {
    id: 'rimshot',
    name: 'Wooden Rimshot',
    shortName: 'RIM',
    color: 'rose',
    activeColor: 'bg-rose-400 shadow-rose-400/50 text-slate-950',
    volume: 0.75,
    isMuted: false,
    isSolo: false,
    steps: [...DEFAULT_PRESETS.nashville_acoustic.pattern.rimshot]
  },
  {
    id: 'tom',
    name: 'Resonant Tom',
    shortName: 'TOM',
    color: 'orange',
    activeColor: 'bg-orange-400 shadow-orange-400/50 text-slate-950',
    volume: 0.8,
    isMuted: false,
    isSolo: false,
    steps: [...DEFAULT_PRESETS.nashville_acoustic.pattern.tom]
  },
  {
    id: 'shaker',
    name: 'Acoustic Shaker',
    shortName: 'SHAK',
    color: 'lime',
    activeColor: 'bg-lime-400 shadow-lime-400/50 text-slate-950',
    volume: 0.7,
    isMuted: false,
    isSolo: false,
    steps: [...DEFAULT_PRESETS.nashville_acoustic.pattern.shaker]
  }
];

export const MidiStepSequencer: React.FC<MidiStepSequencerProps> = ({
  initialBpm = 120,
  isDawPlaying = false,
  onClose,
  isDarkMode = true
}) => {
  const [drumTracks, setDrumTracks] = useState<DrumTrackConfig[]>(INITIAL_DRUM_TRACKS);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(-1);
  const [bpm, setBpm] = useState<number>(initialBpm || 120);
  const [swing, setSwing] = useState<number>(10); // 0 to 50%
  const [selectedPreset, setSelectedPreset] = useState<string>('nashville_acoustic');
  const [syncWithDaw, setSyncWithDaw] = useState<boolean>(true);

  // Sync BPM when initialBpm prop updates from selected track
  useEffect(() => {
    if (initialBpm && initialBpm > 40 && initialBpm < 260) {
      setBpm(initialBpm);
    }
  }, [initialBpm]);

  // Synchronize playback with main DAW playback if enabled
  useEffect(() => {
    if (syncWithDaw) {
      if (isDawPlaying && !isPlaying) {
        setIsPlaying(true);
      } else if (!isDawPlaying && isPlaying) {
        setIsPlaying(false);
        setCurrentStep(-1);
      }
    }
  }, [isDawPlaying, syncWithDaw]);

  // High-precision Web Audio clock loop
  const timerRef = useRef<number | null>(null);
  const nextNoteTimeRef = useRef<number>(0);
  const currentStepRef = useRef<number>(0);
  const drumTracksRef = useRef<DrumTrackConfig[]>(drumTracks);
  drumTracksRef.current = drumTracks;

  const bpmRef = useRef<number>(bpm);
  bpmRef.current = bpm;

  const swingRef = useRef<number>(swing);
  swingRef.current = swing;

  const isPlayingRef = useRef<boolean>(isPlaying);
  isPlayingRef.current = isPlaying;

  // Schedule a step
  const scheduleStep = useCallback((stepNumber: number, time: number) => {
    const tracks = drumTracksRef.current;
    const hasSolo = tracks.some(t => t.isSolo);

    tracks.forEach(track => {
      if (track.isMuted) return;
      if (hasSolo && !track.isSolo) return;

      const stepVal = track.steps[stepNumber];
      if (stepVal > 0) {
        let velocity = 1.0;
        if (stepVal === 2) velocity = 1.4; // Accent
        if (stepVal === 3) velocity = 0.5; // Ghost note
        velocity *= track.volume;

        // Trigger synthesized drum hit
        audioMiniDaw.triggerPercussionHit(track.id, velocity);
      }
    });
  }, []);

  // Web Audio scheduler tick
  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setCurrentStep(-1);
      return;
    }

    const ctx = audioMiniDaw.getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume();
    }

    nextNoteTimeRef.current = (ctx?.currentTime || 0) + 0.05;
    currentStepRef.current = 0;

    const lookahead = 25.0; // milliseconds
    const scheduleAheadTime = 0.1; // seconds

    const timer = setInterval(() => {
      const currentAudioTime = ctx?.currentTime || 0;

      while (nextNoteTimeRef.current < currentAudioTime + scheduleAheadTime) {
        const step = currentStepRef.current;
        scheduleStep(step, nextNoteTimeRef.current);
        setCurrentStep(step);

        // Advance step
        const secondsPerBeat = 60.0 / bpmRef.current;
        let stepDuration = 0.25 * secondsPerBeat; // 16th note

        // Apply swing on odd steps (1, 3, 5, etc.)
        if (step % 2 === 0) {
          stepDuration += (swingRef.current / 100) * 0.12 * secondsPerBeat;
        } else {
          stepDuration -= (swingRef.current / 100) * 0.12 * secondsPerBeat;
        }

        nextNoteTimeRef.current += Math.max(0.04, stepDuration);
        currentStepRef.current = (currentStepRef.current + 1) % 16;
      }
    }, lookahead);

    timerRef.current = timer as unknown as number;

    return () => {
      clearInterval(timer);
    };
  }, [isPlaying, scheduleStep]);

  // Toggle individual step in grid: 0 (Off) -> 1 (Normal) -> 2 (Accent) -> 3 (Ghost) -> 0 (Off)
  const handleToggleStep = (trackId: DrumVoiceId, stepIndex: number) => {
    setDrumTracks(prev =>
      prev.map(t => {
        if (t.id !== trackId) return t;
        const newSteps = [...t.steps];
        const currentVal = newSteps[stepIndex];
        const nextVal = currentVal === 0 ? 1 : currentVal === 1 ? 2 : currentVal === 2 ? 3 : 0;
        newSteps[stepIndex] = nextVal;
        return { ...t, steps: newSteps };
      })
    );

    // Audio preview on click
    const track = drumTracks.find(t => t.id === trackId);
    if (track) {
      audioMiniDaw.triggerPercussionHit(trackId, track.volume);
    }
  };

  // Trigger test hit manually
  const handleTestHit = (trackId: DrumVoiceId) => {
    const track = drumTracks.find(t => t.id === trackId);
    audioMiniDaw.triggerPercussionHit(trackId, (track?.volume || 0.8) * 1.2);
  };

  // Toggle Mute
  const handleToggleMute = (trackId: DrumVoiceId) => {
    setDrumTracks(prev =>
      prev.map(t => (t.id === trackId ? { ...t, isMuted: !t.isMuted } : t))
    );
  };

  // Toggle Solo
  const handleToggleSolo = (trackId: DrumVoiceId) => {
    setDrumTracks(prev =>
      prev.map(t => (t.id === trackId ? { ...t, isSolo: !t.isSolo } : t))
    );
  };

  // Volume slider
  const handleVolumeChange = (trackId: DrumVoiceId, val: number) => {
    setDrumTracks(prev =>
      prev.map(t => (t.id === trackId ? { ...t, volume: val } : t))
    );
  };

  // Load a preset rhythm
  const handleSelectPreset = (presetKey: string) => {
    const preset = DEFAULT_PRESETS[presetKey];
    if (!preset) return;
    setSelectedPreset(presetKey);

    setDrumTracks(prev =>
      prev.map(t => ({
        ...t,
        steps: [...(preset.pattern[t.id] || Array(16).fill(0))]
      }))
    );
  };

  // Clear all 16 steps
  const handleClearAll = () => {
    setDrumTracks(prev =>
      prev.map(t => ({
        ...t,
        steps: Array(16).fill(0)
      }))
    );
  };

  // Randomize a musical groove
  const handleRandomize = () => {
    setDrumTracks(prev =>
      prev.map(t => {
        const randSteps = Array(16).fill(0);
        if (t.id === 'kick') {
          randSteps[0] = 2;
          randSteps[8] = 2;
          if (Math.random() > 0.4) randSteps[6] = 1;
          if (Math.random() > 0.5) randSteps[10] = 1;
          if (Math.random() > 0.6) randSteps[14] = 1;
        } else if (t.id === 'snare' || t.id === 'clap') {
          randSteps[4] = 2;
          randSteps[12] = 2;
          if (Math.random() > 0.7) randSteps[15] = 3;
        } else if (t.id === 'hihat') {
          for (let i = 0; i < 16; i += 2) {
            randSteps[i] = Math.random() > 0.3 ? 1 : 2;
          }
          if (Math.random() > 0.5) {
            randSteps[3] = 3;
            randSteps[7] = 3;
            randSteps[11] = 3;
          }
        } else if (t.id === 'shaker') {
          for (let i = 0; i < 16; i++) {
            randSteps[i] = i % 2 === 0 ? 1 : 3;
          }
        } else if (t.id === 'openhat') {
          if (Math.random() > 0.4) randSteps[2] = 1;
          if (Math.random() > 0.4) randSteps[10] = 1;
          if (Math.random() > 0.5) randSteps[14] = 2;
        } else if (t.id === 'rimshot') {
          if (Math.random() > 0.5) randSteps[7] = 1;
          if (Math.random() > 0.5) randSteps[15] = 1;
        } else if (t.id === 'tom') {
          if (Math.random() > 0.6) {
            randSteps[13] = 1;
            randSteps[14] = 2;
          }
        }
        return { ...t, steps: randSteps };
      })
    );
  };

  const getStepButtonClass = (track: DrumTrackConfig, stepVal: number, stepIndex: number) => {
    const isCurrent = currentStep === stepIndex;
    const isBeatStart = stepIndex % 4 === 0;

    let base = 'relative min-h-[44px] sm:min-h-[38px] w-full rounded-lg font-mono text-[11px] font-bold transition-all flex flex-col items-center justify-center cursor-pointer select-none border active:scale-95 ';

    // Cursor playhead glow
    if (isCurrent) {
      base += 'ring-2 ring-amber-400 z-10 scale-[1.04] ';
    }

    if (stepVal === 0) {
      // Off state
      base += isDarkMode
        ? isBeatStart
          ? 'bg-slate-900/90 border-slate-700/80 hover:bg-slate-800 text-slate-500 hover:text-slate-300'
          : 'bg-slate-950/70 border-slate-800/60 hover:bg-slate-800/70 text-slate-600 hover:text-slate-400'
        : isBeatStart
        ? 'bg-slate-200 border-slate-300 hover:bg-slate-300 text-slate-400'
        : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-300';
    } else if (stepVal === 1) {
      // Normal hit (1.0)
      base += `${track.activeColor} border-white/20 shadow-md font-extrabold`;
    } else if (stepVal === 2) {
      // Accent hit (1.4)
      base += `${track.activeColor} ring-2 ring-white/60 shadow-lg font-black scale-[1.03]`;
    } else if (stepVal === 3) {
      // Ghost note (0.5)
      base += `${track.activeColor} opacity-60 border-dashed border-white/40 text-[9px]`;
    }

    return base;
  };

  return (
    <div
      className={`border rounded-2xl shadow-2xl p-4 sm:p-5 transition-all backdrop-blur-xl ${
        isDarkMode
          ? 'bg-slate-950/95 border-slate-800 text-slate-100 ring-1 ring-white/10'
          : 'bg-white/95 border-slate-300 text-slate-900 shadow-xl'
      }`}
    >
      {/* Sequencer Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
            <Music className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black tracking-tight uppercase font-mono">
                16-Step MIDI Percussion Sequencer
              </h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Web Audio Synth Engine
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Interactive 8-voice drum grid with velocity accents, swing groove, and zero-latency real-time playback
            </p>
          </div>
        </div>

        {/* Global Controls & Preset Selector */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Preset Selector */}
          <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-800 text-xs">
            <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">Preset:</span>
            <select
              value={selectedPreset}
              onChange={(e) => handleSelectPreset(e.target.value)}
              className="bg-transparent text-xs font-bold text-amber-300 focus:outline-hidden cursor-pointer"
            >
              {Object.entries(DEFAULT_PRESETS).map(([key, p]) => (
                <option key={key} value={key} className="bg-slate-900 text-white">
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* BPM Tempo */}
          <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono font-bold">
            <span className="text-slate-400 text-[10px]">BPM:</span>
            <input
              type="number"
              min="40"
              max="240"
              value={bpm}
              onChange={(e) => setBpm(Math.max(40, Math.min(240, parseInt(e.target.value) || 120)))}
              className="w-12 bg-transparent text-indigo-300 font-bold focus:outline-hidden text-right"
            />
          </div>

          {/* Swing % */}
          <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono font-bold">
            <span className="text-slate-400 text-[10px]">SWING:</span>
            <input
              type="range"
              min="0"
              max="50"
              value={swing}
              onChange={(e) => setSwing(parseInt(e.target.value))}
              className="w-14 accent-amber-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
            />
            <span className="text-amber-300 text-[10px] w-6">{swing}%</span>
          </div>

          {/* DAW Sync Toggle */}
          <button
            onClick={() => setSyncWithDaw(prev => !prev)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold font-mono border transition cursor-pointer flex items-center gap-1.5 ${
              syncWithDaw
                ? 'bg-emerald-950/70 text-emerald-300 border-emerald-600/60 shadow-xs'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
            title="When active, sequencer automatically starts and stops when you press Play in the DAW"
          >
            <Radio className="w-3.5 h-3.5" />
            <span>DAW Link: {syncWithDaw ? 'ON' : 'OFF'}</span>
          </button>

          {/* Transport Play/Stop */}
          <button
            onClick={() => setIsPlaying(prev => !prev)}
            className={`px-4 py-1.5 rounded-xl font-bold text-xs font-mono flex items-center gap-2 shadow-lg transition select-none cursor-pointer border ${
              isPlaying
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-300 shadow-amber-500/25 ring-2 ring-amber-400/50'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500 shadow-indigo-600/30'
            }`}
          >
            {isPlaying ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop Loop</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Play Loop</span>
              </>
            )}
          </button>

          {/* Randomize Groove */}
          <button
            onClick={handleRandomize}
            className="p-1.5 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            title="Randomize groove pattern musically"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Randomize</span>
          </button>

          {/* Clear Grid */}
          <button
            onClick={handleClearAll}
            className="p-1.5 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-300 border border-slate-800 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            title="Clear all active notes in the grid"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>

          {/* Close button if provided */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition cursor-pointer"
              title="Close Sequencer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Responsive 16-Step Grid (Wraps cleanly to 8x2 on Cover Screens, expands to 16 columns on Unfolded/Desktop) */}
      <div className="pb-2">
        <div className="w-full">
          {/* Step Number Bar (Hidden on narrow cover screen; shown on unfolded/tablet+) */}
          <div className="hidden md:grid grid-cols-[190px_1fr] gap-2 items-center mb-2 px-1">
            <div className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
              VOICE / CONTROLS
            </div>

            {/* 16 Step Indicators Grouped in 4 Beats */}
            <div className="grid grid-cols-16 gap-1 text-center font-mono text-[10px] tabular-nums">
              {Array.from({ length: 16 }).map((_, idx) => {
                const beatNum = Math.floor(idx / 4) + 1;
                const isBeatStart = idx % 4 === 0;
                const isCurrent = currentStep === idx;
                return (
                  <div
                    key={idx}
                    className={`py-1 rounded-sm transition-colors ${
                      isCurrent
                        ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                        : isBeatStart
                        ? 'bg-slate-800 text-slate-200 font-bold'
                        : 'bg-slate-900/60 text-slate-500'
                    }`}
                  >
                    {isBeatStart ? `${beatNum}.${(idx % 4) + 1}` : idx + 1}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Drum Rows */}
          <div className="space-y-2.5 md:space-y-1.5">
            {drumTracks.map((track) => {
              const hasActiveSteps = track.steps.some(s => s > 0);
              return (
                <div
                  key={track.id}
                  className={`grid grid-cols-1 md:grid-cols-[190px_1fr] gap-2.5 md:gap-2 items-center p-2.5 md:p-1.5 rounded-xl border transition ${
                    isDarkMode
                      ? 'bg-slate-900/70 border-slate-800/80 hover:border-slate-700'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Voice Strip: Test Trigger, Name, Mute/Solo, Volume */}
                  <div className="flex items-center gap-2 md:pr-2 md:border-r border-slate-800/60 select-none">
                    {/* Test Trigger Button (44px on touch) */}
                    <button
                      onClick={() => handleTestHit(track.id)}
                      className="min-w-[40px] min-h-[40px] sm:min-w-[32px] sm:min-h-[32px] rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-amber-300 flex items-center justify-center transition active:scale-95 cursor-pointer shrink-0"
                      title={`Preview ${track.name}`}
                    >
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    </button>

                    {/* Name */}
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold tracking-tight truncate flex items-center gap-1.5">
                        <span className="truncate">{track.shortName}</span>
                        {hasActiveSteps && (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                        )}
                      </div>
                    </div>

                    {/* Mute button */}
                    <button
                      onClick={() => handleToggleMute(track.id)}
                      className={`min-w-[40px] min-h-[40px] sm:min-w-[28px] sm:min-h-[28px] rounded-lg text-[10px] font-mono font-bold transition flex items-center justify-center active:scale-95 cursor-pointer ${
                        track.isMuted
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-slate-800 text-slate-300 hover:text-white'
                      }`}
                      title={track.isMuted ? 'Unmute voice' : 'Mute voice'}
                    >
                      M
                    </button>

                    {/* Solo button */}
                    <button
                      onClick={() => handleToggleSolo(track.id)}
                      className={`min-w-[40px] min-h-[40px] sm:min-w-[28px] sm:min-h-[28px] rounded-lg text-[10px] font-mono font-bold transition flex items-center justify-center active:scale-95 cursor-pointer ${
                        track.isSolo
                          ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                          : 'bg-slate-800 text-slate-300 hover:text-white'
                      }`}
                      title={track.isSolo ? 'Unsolo voice' : 'Solo voice'}
                    >
                      S
                    </button>

                    {/* Volume slider */}
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={track.volume}
                      onChange={(e) => handleVolumeChange(track.id, parseFloat(e.target.value))}
                      className="w-14 sm:w-12 accent-amber-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
                      title={`Volume: ${Math.round(track.volume * 100)}%`}
                    />
                  </div>

                  {/* 16 Step Buttons: 8x2 Grid on Cover Screens -> 16 Columns on Unfolded/Desktop */}
                  <div className="grid grid-cols-8 md:grid-cols-16 gap-1.5 sm:gap-1">
                    {track.steps.map((stepVal, stepIdx) => (
                      <button
                        key={stepIdx}
                        onClick={() => handleToggleStep(track.id, stepIdx)}
                        className={getStepButtonClass(track, stepVal, stepIdx)}
                        title={`${track.name} - Step ${stepIdx + 1}: ${
                          stepVal === 0 ? 'Off' : stepVal === 1 ? 'Normal' : stepVal === 2 ? 'Accent (+4dB)' : 'Ghost (-6dB)'
                        } (Tap to cycle)`}
                      >
                        <span className="text-[9px] opacity-40 md:hidden leading-none mb-0.5 tabular-nums">{stepIdx + 1}</span>
                        <span>{stepVal === 2 ? '▲' : stepVal === 3 ? '•' : ''}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend and Operating Tips */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 mt-3 border-t border-slate-800/60 text-[10px] font-mono text-slate-400">
            <div className="flex items-center gap-4">
              <span className="font-bold text-slate-300">VELOCITY LEGEND:</span>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-slate-800 border border-slate-700" />
                <span>Off (0)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-amber-400 text-slate-950 text-[8px] font-bold flex items-center justify-center" />
                <span>Normal (1.0)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-amber-400 ring-2 ring-white/60 text-slate-950 text-[8px] font-bold flex items-center justify-center">▲</span>
                <span>Accent (1.4)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-amber-400/60 text-slate-950 text-[8px] font-bold flex items-center justify-center">•</span>
                <span>Ghost (0.5)</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500">Click pads repeatedly to cycle velocity: Off → Normal → Accent → Ghost</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
