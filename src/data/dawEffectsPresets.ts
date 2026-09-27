import { DawEffectsState, MixerTrack } from '../types';

export const INITIAL_DAW_STEMS: MixerTrack[] = [
  { id: 1, name: "Track 1: Master Instrumental", vol: 90, pan: 0, muted: false, solo: false, trimIn: 0, trimOut: 100, freq: 110, waveType: 'sawtooth', color: '#6366f1' },
  { id: 2, name: "Track 2: Dry Vocal (UVR5)", vol: 95, pan: 0, muted: false, solo: false, trimIn: 0, trimOut: 100, freq: 220, waveType: 'triangle', color: '#10b981' },
  { id: 3, name: "Track 3: Harmonies & Ad-libs", vol: 75, pan: -20, muted: false, solo: false, trimIn: 0, trimOut: 100, freq: 330, waveType: 'sine', color: '#f59e0b' },
  { id: 4, name: "Track 4: Click & Ambient Plate", vol: 60, pan: 20, muted: false, solo: false, trimIn: 0, trimOut: 100, freq: 440, waveType: 'square', color: '#ec4899' }
];

export const DEFAULT_DAW_EFFECTS: DawEffectsState = {
  eq: {
    low: 1.5,
    mid: -0.5,
    high: 2.0,
    enabled: true
  },
  compressor: {
    threshold: -18,
    ratio: 2.5,
    attack: 0.02,
    release: 0.25,
    makeup: 2.0,
    enabled: true
  },
  reverb: {
    mix: 20,
    decay: 2.2,
    roomType: 'plate',
    enabled: true
  },
  tapeDrive: {
    drive: 15,
    warmth: true,
    enabled: true
  },
  stereo: {
    width: 110,
    isMonoCollapse: false
  },
  busRouting: 'master',
  activeFxPresetName: 'Nashville Radio Master'
};

export interface DawFxPresetDefinition {
  id: string;
  name: string;
  description: string;
  tag: string;
  effects: DawEffectsState;
}

export const DAW_FX_PRESET_LIBRARY: DawFxPresetDefinition[] = [
  {
    id: 'fx_nashville_master',
    name: 'Nashville Radio Master',
    description: 'Silky high-end sheen, transparent 2.5:1 bus compression, subtle warm tape drive, and smooth studio plate reverb.',
    tag: 'Radio Broadcast',
    effects: {
      eq: { low: 1.5, mid: -0.5, high: 2.5, enabled: true },
      compressor: { threshold: -18, ratio: 2.5, attack: 0.02, release: 0.25, makeup: 2.0, enabled: true },
      reverb: { mix: 20, decay: 2.0, roomType: 'plate', enabled: true },
      tapeDrive: { drive: 15, warmth: true, enabled: true },
      stereo: { width: 110, isMonoCollapse: false },
      busRouting: 'master',
      activeFxPresetName: 'Nashville Radio Master'
    }
  },
  {
    id: 'fx_punchy_worship',
    name: 'Punchy 808 & Trap Worship',
    description: 'Heavy low-end boost (+4dB @ 80Hz), punchy 4:1 VCA compression, tight 1.4s plate, and focused stereo image.',
    tag: 'Bass & Dynamics',
    effects: {
      eq: { low: 4.0, mid: -1.0, high: 1.5, enabled: true },
      compressor: { threshold: -24, ratio: 4.0, attack: 0.008, release: 0.15, makeup: 4.0, enabled: true },
      reverb: { mix: 15, decay: 1.4, roomType: 'plate', enabled: true },
      tapeDrive: { drive: 30, warmth: true, enabled: true },
      stereo: { width: 100, isMonoCollapse: false },
      busRouting: 'master',
      activeFxPresetName: 'Punchy 808 & Trap Worship'
    }
  },
  {
    id: 'fx_acoustic_warmth',
    name: 'Acoustic Warmth & Intimacy',
    description: 'Vintage transformer color with rich harmonic drive, lush medium hall reverb, and natural unhyped frequency response.',
    tag: 'Warm Vintage',
    effects: {
      eq: { low: 2.0, mid: 1.0, high: 0.5, enabled: true },
      compressor: { threshold: -14, ratio: 1.8, attack: 0.04, release: 0.4, makeup: 1.0, enabled: true },
      reverb: { mix: 28, decay: 3.2, roomType: 'hall', enabled: true },
      tapeDrive: { drive: 40, warmth: true, enabled: true },
      stereo: { width: 120, isMonoCollapse: false },
      busRouting: 'master',
      activeFxPresetName: 'Acoustic Warmth & Intimacy'
    }
  },
  {
    id: 'fx_selah_drone',
    name: 'Lofi Selah Ambient Drone',
    description: 'Cathedral reverb wash (45%), deep analog tape saturation, rolled-off top end for meditative prayer reflection.',
    tag: 'Selah Meditation',
    effects: {
      eq: { low: 3.0, mid: 0.0, high: -3.5, enabled: true },
      compressor: { threshold: -20, ratio: 3.0, attack: 0.03, release: 0.5, makeup: 2.5, enabled: true },
      reverb: { mix: 45, decay: 5.5, roomType: 'cathedral', enabled: true },
      tapeDrive: { drive: 55, warmth: true, enabled: true },
      stereo: { width: 135, isMonoCollapse: false },
      busRouting: 'master',
      activeFxPresetName: 'Lofi Selah Ambient Drone'
    }
  },
  {
    id: 'fx_stadium_pop',
    name: 'Stadium Modern Pop Anthem',
    description: 'Ultra-wide stereo spread (140%), aggressive modern high shelf, fast punchy side-chained compressor, and crisp plate.',
    tag: 'High Energy',
    effects: {
      eq: { low: 2.5, mid: 0.5, high: 3.5, enabled: true },
      compressor: { threshold: -22, ratio: 3.5, attack: 0.015, release: 0.18, makeup: 3.5, enabled: true },
      reverb: { mix: 22, decay: 2.4, roomType: 'plate', enabled: true },
      tapeDrive: { drive: 20, warmth: false, enabled: true },
      stereo: { width: 140, isMonoCollapse: false },
      busRouting: 'master',
      activeFxPresetName: 'Stadium Modern Pop Anthem'
    }
  },
  {
    id: 'fx_bypass_flat',
    name: 'Bypass All FX (Flat Raw)',
    description: 'Bypasses all master EQ, compression, drive, and reverb for raw, uncolored stem monitoring.',
    tag: 'Dry Monitoring',
    effects: {
      eq: { low: 0, mid: 0, high: 0, enabled: false },
      compressor: { threshold: 0, ratio: 1, attack: 0.05, release: 0.2, makeup: 0, enabled: false },
      reverb: { mix: 0, decay: 1.0, roomType: 'room', enabled: false },
      tapeDrive: { drive: 0, warmth: false, enabled: false },
      stereo: { width: 100, isMonoCollapse: false },
      busRouting: 'master',
      activeFxPresetName: 'Bypass All FX (Flat Raw)'
    }
  }
];
