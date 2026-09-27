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
      eq: { low: 1.5, mid: 1.2, high: 2.4, enabled: true },
      compressor: { threshold: -19, ratio: 2.8, attack: 0.018, release: 0.2, makeup: 2.6, enabled: true },
      reverb: { mix: 20, decay: 2.0, roomType: 'plate', enabled: true },
      tapeDrive: { drive: 18, warmth: true, enabled: true },
      stereo: { width: 112, isMonoCollapse: false },
      busRouting: 'master',
      activeFxPresetName: 'Nashville Radio Master',
      targetLufs: -12.0,
      truePeakCeilingDb: -0.8
    }
  },
  {
    id: 'fx_spotify_master',
    name: 'Spotify & YouTube Standard',
    description: 'Precision transparent bus glue with smooth +1.5dB air sheen at 10kHz, controlled 80Hz bass contour, calibrated to -14.0 LUFS.',
    tag: 'Streaming -14LUFS',
    effects: {
      eq: { low: 1.2, mid: -0.4, high: 1.8, enabled: true },
      compressor: { threshold: -16, ratio: 2.2, attack: 0.025, release: 0.22, makeup: 1.8, enabled: true },
      reverb: { mix: 14, decay: 1.8, roomType: 'plate', enabled: true },
      tapeDrive: { drive: 12, warmth: true, enabled: true },
      stereo: { width: 108, isMonoCollapse: false },
      busRouting: 'master',
      activeFxPresetName: 'Spotify & YouTube Standard',
      targetLufs: -14.0,
      truePeakCeilingDb: -1.0
    }
  },
  {
    id: 'fx_apple_music',
    name: 'Apple Music Digital Master',
    description: 'Unhyped natural dynamic range preserving micro-dynamics and vocal transients. Gentle 1.8:1 compression with rich wide stereo field.',
    tag: 'Apple -16LUFS',
    effects: {
      eq: { low: 0.8, mid: 0.2, high: 1.2, enabled: true },
      compressor: { threshold: -14, ratio: 1.8, attack: 0.035, release: 0.35, makeup: 1.0, enabled: true },
      reverb: { mix: 18, decay: 2.4, roomType: 'hall', enabled: true },
      tapeDrive: { drive: 8, warmth: true, enabled: true },
      stereo: { width: 118, isMonoCollapse: false },
      busRouting: 'master',
      activeFxPresetName: 'Apple Music Digital Master',
      targetLufs: -16.0,
      truePeakCeilingDb: -1.0
    }
  },
  {
    id: 'fx_club_slam',
    name: 'Club & EDM Competitive Slam',
    description: 'Heavy sub-bass energy (+3.5dB low shelf), fast punchy 3.8:1 compression with fast release, harmonically rich saturation.',
    tag: 'Club -9LUFS',
    effects: {
      eq: { low: 3.5, mid: -0.8, high: 2.2, enabled: true },
      compressor: { threshold: -23, ratio: 3.8, attack: 0.008, release: 0.12, makeup: 4.2, enabled: true },
      reverb: { mix: 12, decay: 1.2, roomType: 'room', enabled: true },
      tapeDrive: { drive: 36, warmth: false, enabled: true },
      stereo: { width: 105, isMonoCollapse: false },
      busRouting: 'master',
      activeFxPresetName: 'Club & EDM Competitive Slam',
      targetLufs: -9.0,
      truePeakCeilingDb: -0.3
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
      activeFxPresetName: 'Punchy 808 & Trap Worship',
      targetLufs: -8.5,
      truePeakCeilingDb: -0.3
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
      activeFxPresetName: 'Acoustic Warmth & Intimacy',
      targetLufs: -14.0,
      truePeakCeilingDb: -1.0
    }
  },
  {
    id: 'fx_studer_tape',
    name: '1/2-Inch Studer Analog Tape & Tube',
    description: 'Warm analog transformer color, 2nd-order harmonic glue, silk high-end rolloff preventing harsh digital brittleness.',
    tag: 'Analog Tape',
    effects: {
      eq: { low: 2.2, mid: 0.6, high: -0.8, enabled: true },
      compressor: { threshold: -17, ratio: 2.0, attack: 0.03, release: 0.3, makeup: 2.0, enabled: true },
      reverb: { mix: 22, decay: 2.8, roomType: 'hall', enabled: true },
      tapeDrive: { drive: 48, warmth: true, enabled: true },
      stereo: { width: 114, isMonoCollapse: false },
      busRouting: 'master',
      activeFxPresetName: '1/2-Inch Studer Analog Tape & Tube',
      targetLufs: -13.5,
      truePeakCeilingDb: -1.0
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
      activeFxPresetName: 'Lofi Selah Ambient Drone',
      targetLufs: -15.0,
      truePeakCeilingDb: -1.0
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
      activeFxPresetName: 'Stadium Modern Pop Anthem',
      targetLufs: -10.5,
      truePeakCeilingDb: -0.5
    }
  },
  {
    id: 'fx_broadcast_ebu',
    name: 'EBU R128 Television Broadcast',
    description: 'Strict European and US television loudness standard compliance (-23.0 LUFS), dialogue clarity notch (+1.0 dB @ 1kHz).',
    tag: 'Broadcast -23LUFS',
    effects: {
      eq: { low: -0.5, mid: 0.8, high: 0.5, enabled: true },
      compressor: { threshold: -14, ratio: 2.0, attack: 0.03, release: 0.3, makeup: 0.5, enabled: true },
      reverb: { mix: 10, decay: 1.4, roomType: 'room', enabled: true },
      tapeDrive: { drive: 5, warmth: true, enabled: true },
      stereo: { width: 100, isMonoCollapse: false },
      busRouting: 'master',
      activeFxPresetName: 'EBU R128 Television Broadcast',
      targetLufs: -23.0,
      truePeakCeilingDb: -1.0
    }
  },
  {
    id: 'fx_podcast_polish',
    name: 'Broadcast Podcast & Dialogue',
    description: 'Targeted dialogue presence: Low rumble cleanup, 1-3kHz speech consonant enhancement, 3:1 vocal leveling.',
    tag: 'Spoken Word -16LUFS',
    effects: {
      eq: { low: -1.5, mid: 1.8, high: 1.5, enabled: true },
      compressor: { threshold: -18, ratio: 3.0, attack: 0.015, release: 0.25, makeup: 2.4, enabled: true },
      reverb: { mix: 0, decay: 0.8, roomType: 'room', enabled: false },
      tapeDrive: { drive: 10, warmth: true, enabled: true },
      stereo: { width: 95, isMonoCollapse: false },
      busRouting: 'master',
      activeFxPresetName: 'Broadcast Podcast & Dialogue',
      targetLufs: -16.0,
      truePeakCeilingDb: -1.5
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
      activeFxPresetName: 'Bypass All FX (Flat Raw)',
      targetLufs: -14.0,
      truePeakCeilingDb: -1.0
    }
  }
];
