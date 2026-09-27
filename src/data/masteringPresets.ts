import { MasteringPreset, DawEffectsState } from '../types';

export const MASTERING_PRESETS_CATALOG: MasteringPreset[] = [
  {
    id: 'mst_spotify_streaming',
    name: 'Spotify & YouTube Standard',
    category: 'Streaming',
    targetLufs: -14.0,
    truePeakCeiling: -1.0,
    targetLra: 8.5,
    badge: 'Streaming Standard',
    platformSpec: 'Spotify / YouTube / Tidal / Amazon Music (-14.0 LUFS | -1.0 dBTP)',
    description: 'Precision transparent bus glue with smooth +1.5dB air sheen at 10kHz, controlled 80Hz bass contour, and 2.2:1 VCA compression to prevent lossy streaming codec distortion.',
    tags: ['Spotify', 'YouTube', 'Streaming', 'Universal', 'Clean'],
    effects: {
      eq: { low: 1.2, mid: -0.4, high: 1.8, enabled: true },
      compressor: { threshold: -16, ratio: 2.2, attack: 0.025, release: 0.22, makeup: 1.8, enabled: true },
      reverb: { mix: 14, decay: 1.8, roomType: 'plate', enabled: true },
      tapeDrive: { drive: 12, warmth: true, enabled: true },
      stereo: { width: 108, isMonoCollapse: false },
      busRouting: 'master',
      activeFxPresetName: 'Spotify & YouTube Standard',
      targetLufs: -14.0,
      truePeakCeilingDb: -1.0,
      correctionGainDb: 0
    }
  },
  {
    id: 'mst_apple_digital',
    name: 'Apple Music Digital Master (ADM)',
    category: 'Streaming',
    targetLufs: -16.0,
    truePeakCeiling: -1.0,
    targetLra: 10.2,
    badge: 'Audiophile Spatial',
    platformSpec: 'Apple Music / Sound Check (-16.0 LUFS | -1.0 dBTP)',
    description: 'Unhyped natural dynamic range preserving micro-dynamics and vocal transients. Gentle 1.8:1 compression with rich wide stereo field (118%) for Spatial Audio and lossless ALAC playback.',
    tags: ['Apple Music', 'Spatial', 'Dynamic', 'High-Res', 'Hi-Fi'],
    effects: {
      eq: { low: 0.8, mid: 0.2, high: 1.2, enabled: true },
      compressor: { threshold: -14, ratio: 1.8, attack: 0.035, release: 0.35, makeup: 1.0, enabled: true },
      reverb: { mix: 18, decay: 2.4, roomType: 'hall', enabled: true },
      tapeDrive: { drive: 8, warmth: true, enabled: true },
      stereo: { width: 118, isMonoCollapse: false },
      busRouting: 'master',
      activeFxPresetName: 'Apple Music Digital Master',
      targetLufs: -16.0,
      truePeakCeilingDb: -1.0,
      correctionGainDb: 0
    }
  },
  {
    id: 'mst_nashville_radio',
    name: 'Nashville Radio Country-Pop',
    category: 'Radio & Commercial',
    targetLufs: -12.0,
    truePeakCeiling: -0.8,
    targetLra: 7.0,
    badge: 'Nashville Benchmark',
    platformSpec: 'Country Radio & Commercial Hot 100 (-12.0 LUFS | -0.8 dBTP)',
    description: 'Vocal-forward modern Nashville polish: +1.6dB high-shelf acoustic shimmer, +1.2dB vocal body at 1kHz, punchy VCA bus leveling, and subtle analog tape glue for in-car and radio broadcast.',
    tags: ['Nashville', 'Radio', 'Country Pop', 'Vocal Polish', 'Broadcast'],
    effects: {
      eq: { low: 1.5, mid: 1.2, high: 2.4, enabled: true },
      compressor: { threshold: -19, ratio: 2.8, attack: 0.018, release: 0.2, makeup: 2.6, enabled: true },
      reverb: { mix: 20, decay: 2.0, roomType: 'plate', enabled: true },
      tapeDrive: { drive: 18, warmth: true, enabled: true },
      stereo: { width: 112, isMonoCollapse: false },
      busRouting: 'master',
      activeFxPresetName: 'Nashville Radio Country-Pop',
      targetLufs: -12.0,
      truePeakCeilingDb: -0.8,
      correctionGainDb: 0
    }
  },
  {
    id: 'mst_club_edm_slam',
    name: 'Club & EDM Competitive Slam',
    category: 'Modern Punch',
    targetLufs: -9.0,
    truePeakCeiling: -0.3,
    targetLra: 4.8,
    badge: 'Maximum Impact',
    platformSpec: 'Club Systems, Beatport & DJ Festivals (-9.0 LUFS | -0.3 dBTP)',
    description: 'Heavy sub-bass energy (+3.5dB low shelf), fast punchy 3.8:1 compression with fast release, harmonically rich saturation for festival sound systems and subwoofers.',
    tags: ['Club', 'EDM', 'Loud', 'Bass', 'Festival'],
    effects: {
      eq: { low: 3.5, mid: -0.8, high: 2.2, enabled: true },
      compressor: { threshold: -23, ratio: 3.8, attack: 0.008, release: 0.12, makeup: 4.2, enabled: true },
      reverb: { mix: 12, decay: 1.2, roomType: 'room', enabled: true },
      tapeDrive: { drive: 36, warmth: false, enabled: true },
      stereo: { width: 105, isMonoCollapse: false },
      busRouting: 'master',
      activeFxPresetName: 'Club & EDM Competitive Slam',
      targetLufs: -9.0,
      truePeakCeilingDb: -0.3,
      correctionGainDb: 0
    }
  },
  {
    id: 'mst_trap_808_anthem',
    name: 'Modern Trap & 808 Festival',
    category: 'Modern Punch',
    targetLufs: -8.5,
    truePeakCeiling: -0.3,
    targetLra: 4.2,
    badge: 'Heavy Sub Bass',
    platformSpec: 'Trap / Hip-Hop / TikTok Virality (-8.5 LUFS | -0.3 dBTP)',
    description: 'Tuned specifically for massive 808 sub basslines and hyper-crisp hi-hat rolls. Mid mud notch at 500Hz, tube saturation warmth, and locked sub-center mono imaging.',
    tags: ['Trap', '808', 'Hip Hop', 'Bass Heavy', 'Punchy'],
    effects: {
      eq: { low: 4.2, mid: -1.2, high: 3.0, enabled: true },
      compressor: { threshold: -25, ratio: 4.2, attack: 0.006, release: 0.14, makeup: 4.8, enabled: true },
      reverb: { mix: 10, decay: 1.0, roomType: 'plate', enabled: true },
      tapeDrive: { drive: 42, warmth: true, enabled: true },
      stereo: { width: 102, isMonoCollapse: false },
      busRouting: 'master',
      activeFxPresetName: 'Modern Trap & 808 Festival',
      targetLufs: -8.5,
      truePeakCeilingDb: -0.3,
      correctionGainDb: 0
    }
  },
  {
    id: 'mst_warm_studer_tape',
    name: '1/2-Inch Studer A800 Tape & Tube Warmth',
    category: 'Warm Vintage',
    targetLufs: -13.5,
    truePeakCeiling: -1.0,
    targetLra: 8.0,
    badge: 'Analog Vintage',
    platformSpec: 'Vintage Vinyl & Tube Mastering (-13.5 LUFS | -1.0 dBTP)',
    description: 'Warm analog transformer color, 2nd-order harmonic glue, silk high-end rolloff preventing harsh digital brittleness, and natural medium hall ambiance.',
    tags: ['Analog', 'Tape', 'Tube', 'Warm', 'Vintage'],
    effects: {
      eq: { low: 2.2, mid: 0.6, high: -0.8, enabled: true },
      compressor: { threshold: -17, ratio: 2.0, attack: 0.03, release: 0.3, makeup: 2.0, enabled: true },
      reverb: { mix: 22, decay: 2.8, roomType: 'hall', enabled: true },
      tapeDrive: { drive: 48, warmth: true, enabled: true },
      stereo: { width: 114, isMonoCollapse: false },
      busRouting: 'master',
      activeFxPresetName: '1/2-Inch Studer A800 Tape & Tube',
      targetLufs: -13.5,
      truePeakCeilingDb: -1.0,
      correctionGainDb: 0
    }
  },
  {
    id: 'mst_stadium_rock_metal',
    name: 'Stadium Rock & Modern Metal',
    category: 'Modern Punch',
    targetLufs: -10.5,
    truePeakCeiling: -0.5,
    targetLra: 5.8,
    badge: 'Wall of Sound',
    platformSpec: 'Alternative Rock, Metal & Arena Pop (-10.5 LUFS | -0.5 dBTP)',
    description: 'Massive stereo spread (128%), aggressive midrange bite for overdriven guitars, fast VCA transient snapping on live drum snares, and tight room reflection.',
    tags: ['Rock', 'Metal', 'Guitars', 'Aggressive', 'Wide'],
    effects: {
      eq: { low: 2.5, mid: 1.4, high: 2.8, enabled: true },
      compressor: { threshold: -21, ratio: 3.2, attack: 0.014, release: 0.16, makeup: 3.4, enabled: true },
      reverb: { mix: 16, decay: 1.6, roomType: 'room', enabled: true },
      tapeDrive: { drive: 28, warmth: false, enabled: true },
      stereo: { width: 128, isMonoCollapse: false },
      busRouting: 'master',
      activeFxPresetName: 'Stadium Rock & Modern Metal',
      targetLufs: -10.5,
      truePeakCeilingDb: -0.5,
      correctionGainDb: 0
    }
  },
  {
    id: 'mst_audiophile_acoustic',
    name: 'Audiophile Acoustic & Classical Intimate',
    category: 'Acoustic & Classical',
    targetLufs: -18.0,
    truePeakCeiling: -2.0,
    targetLra: 13.5,
    badge: 'Pristine Dynamics',
    platformSpec: 'Audiophile Classical, Piano, Chamber & Folk (-18.0 LUFS | -2.0 dBTP)',
    description: 'Zero harmonic clipping or tape distortion. Gentle 1.4:1 leveling preserving the delicate breath of acoustic instruments, solo pianos, and orchestral strings with cathedral acoustics.',
    tags: ['Acoustic', 'Classical', 'Piano', 'Dynamic', 'Audiophile'],
    effects: {
      eq: { low: 0.4, mid: 0.0, high: 0.6, enabled: true },
      compressor: { threshold: -12, ratio: 1.4, attack: 0.05, release: 0.45, makeup: 0.5, enabled: true },
      reverb: { mix: 32, decay: 3.8, roomType: 'cathedral', enabled: true },
      tapeDrive: { drive: 0, warmth: true, enabled: false },
      stereo: { width: 122, isMonoCollapse: false },
      busRouting: 'master',
      activeFxPresetName: 'Audiophile Acoustic & Classical',
      targetLufs: -18.0,
      truePeakCeilingDb: -2.0,
      correctionGainDb: 0
    }
  },
  {
    id: 'mst_ebu_r128_broadcast',
    name: 'EBU R128 / ATSC Television Broadcast',
    category: 'Broadcast & Dialogue',
    targetLufs: -23.0,
    truePeakCeiling: -1.0,
    targetLra: 14.0,
    badge: 'Broadcast Compliant',
    platformSpec: 'European TV (EBU R128) & US Cable (CALM Act) (-23.0 LUFS | -1.0 dBTP)',
    description: 'Strict legal broadcast loudness compliance. Dialogue intelligibility tuning, zero listener fatigue, and robust mono collapse safety for home TVs and mobile streaming.',
    tags: ['Broadcast', 'Television', 'EBU R128', 'CALM Act', 'Dialogue'],
    effects: {
      eq: { low: -0.5, mid: 0.8, high: 0.5, enabled: true },
      compressor: { threshold: -14, ratio: 2.0, attack: 0.03, release: 0.3, makeup: 0.5, enabled: true },
      reverb: { mix: 10, decay: 1.4, roomType: 'room', enabled: true },
      tapeDrive: { drive: 5, warmth: true, enabled: true },
      stereo: { width: 100, isMonoCollapse: false },
      busRouting: 'master',
      activeFxPresetName: 'EBU R128 / ATSC Television Broadcast',
      targetLufs: -23.0,
      truePeakCeilingDb: -1.0,
      correctionGainDb: 0
    }
  },
  {
    id: 'mst_podcast_vocal_polish',
    name: 'Broadcast Podcast & Spoken Word Polish',
    category: 'Broadcast & Dialogue',
    targetLufs: -16.0,
    truePeakCeiling: -1.5,
    targetLra: 6.0,
    badge: 'Spoken Word',
    platformSpec: 'Apple Podcasts, Spotify Podcasts, Voiceover (-16.0 LUFS | -1.5 dBTP)',
    description: 'Targeted dialogue presence: Low rumble cleanup, 1-3kHz speech consonant enhancement, 3:1 vocal leveling to ensure uniform volume across multiple co-hosts with zero room echo.',
    tags: ['Podcast', 'Spoken Word', 'Voice', 'Dialogue', 'Clarity'],
    effects: {
      eq: { low: -1.5, mid: 1.8, high: 1.5, enabled: true },
      compressor: { threshold: -18, ratio: 3.0, attack: 0.015, release: 0.25, makeup: 2.4, enabled: true },
      reverb: { mix: 0, decay: 0.8, roomType: 'room', enabled: false },
      tapeDrive: { drive: 10, warmth: true, enabled: true },
      stereo: { width: 95, isMonoCollapse: false },
      busRouting: 'master',
      activeFxPresetName: 'Broadcast Podcast & Spoken Word',
      targetLufs: -16.0,
      truePeakCeilingDb: -1.5,
      correctionGainDb: 0
    }
  },
  {
    id: 'mst_lofi_midnight_selah',
    name: 'Lo-Fi Midnight Selah Prayer',
    category: 'Warm Vintage',
    targetLufs: -15.0,
    truePeakCeiling: -1.0,
    targetLra: 9.0,
    badge: 'Meditative Ambient',
    platformSpec: 'Lo-Fi Study / Ambient Worship / Sleep Tracks (-15.0 LUFS | -1.0 dBTP)',
    description: 'Warm vinyl flutter, deep tape drive saturation (58%), gently rolled-off highs (-2.8dB) to remove ear fatigue, and a lush 5.0s cathedral reverb wash for contemplative prayer.',
    tags: ['Lo-Fi', 'Selah', 'Ambient', 'Prayer', 'Relaxed'],
    effects: {
      eq: { low: 2.8, mid: 0.2, high: -2.8, enabled: true },
      compressor: { threshold: -20, ratio: 2.6, attack: 0.025, release: 0.45, makeup: 2.2, enabled: true },
      reverb: { mix: 42, decay: 5.0, roomType: 'cathedral', enabled: true },
      tapeDrive: { drive: 58, warmth: true, enabled: true },
      stereo: { width: 130, isMonoCollapse: false },
      busRouting: 'master',
      activeFxPresetName: 'Lo-Fi Midnight Selah Prayer',
      targetLufs: -15.0,
      truePeakCeilingDb: -1.0,
      correctionGainDb: 0
    }
  },
  {
    id: 'mst_bypass_flat',
    name: 'Bypass & Flat Calibration Reference',
    category: 'Corrective',
    targetLufs: -14.0,
    truePeakCeiling: -1.0,
    targetLra: 10.0,
    badge: 'Flat Reference',
    platformSpec: 'Raw Monitoring & A/B Unprocessed Stems',
    description: 'Complete bypass of all master bus equalization, compression, tape saturation, and spatial reverb for transparent A/B stem comparison and level matching.',
    tags: ['Bypass', 'Flat', 'Raw', 'A/B Test', 'Neutral'],
    effects: {
      eq: { low: 0, mid: 0, high: 0, enabled: false },
      compressor: { threshold: 0, ratio: 1, attack: 0.05, release: 0.2, makeup: 0, enabled: false },
      reverb: { mix: 0, decay: 1.0, roomType: 'room', enabled: false },
      tapeDrive: { drive: 0, warmth: false, enabled: false },
      stereo: { width: 100, isMonoCollapse: false },
      busRouting: 'master',
      activeFxPresetName: 'Bypass & Flat Calibration Reference',
      targetLufs: -14.0,
      truePeakCeilingDb: -1.0,
      correctionGainDb: 0
    }
  }
];

export const TARGET_LUFS_PROFILES = [
  { id: 'spotify', label: 'Spotify / YouTube / Tidal', targetLufs: -14.0, ceiling: -1.0, standard: 'AES TD1004 / ITU BS.1770' },
  { id: 'apple', label: 'Apple Music / Sound Check', targetLufs: -16.0, ceiling: -1.0, standard: 'Apple Digital Masters (ADM)' },
  { id: 'nashville', label: 'Nashville Country / Pop Radio', targetLufs: -12.0, ceiling: -0.8, standard: 'Commercial Billboard Benchmark' },
  { id: 'club', label: 'Club / EDM / Trap Slam', targetLufs: -9.0, ceiling: -0.3, standard: 'Competitive Dancefloor Ceiling' },
  { id: 'cd', label: 'CD / High-Energy Commercial', targetLufs: -10.0, ceiling: -0.5, standard: 'Red Book CD Benchmark' },
  { id: 'broadcast', label: 'European TV (EBU R128)', targetLufs: -23.0, ceiling: -1.0, standard: 'EBU R128 Television Spec' },
  { id: 'podcast', label: 'Podcast & Spoken Word', targetLufs: -16.0, ceiling: -1.5, standard: 'Spoken Word Intelligibility' },
  { id: 'audiophile', label: 'Acoustic / Classical Dynamic', targetLufs: -18.0, ceiling: -2.0, standard: 'Audiophile High Dynamic Range' }
];

export const LOCAL_MASTERING_PRESETS_KEY = 'brickos_custom_mastering_presets_v1';

export function getCustomMasteringPresets(): MasteringPreset[] {
  try {
    const raw = localStorage.getItem(LOCAL_MASTERING_PRESETS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (_) {}
  return [];
}

export function saveCustomMasteringPreset(preset: MasteringPreset): MasteringPreset[] {
  const current = getCustomMasteringPresets();
  const existingIdx = current.findIndex(p => p.id === preset.id);
  let updated: MasteringPreset[];
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = preset;
  } else {
    updated = [preset, ...current];
  }
  try {
    localStorage.setItem(LOCAL_MASTERING_PRESETS_KEY, JSON.stringify(updated));
  } catch (_) {}
  return updated;
}

export function deleteCustomMasteringPreset(presetId: string): MasteringPreset[] {
  const current = getCustomMasteringPresets();
  const updated = current.filter(p => p.id !== presetId);
  try {
    localStorage.setItem(LOCAL_MASTERING_PRESETS_KEY, JSON.stringify(updated));
  } catch (_) {}
  return updated;
}
