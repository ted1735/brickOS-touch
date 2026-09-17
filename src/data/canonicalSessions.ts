import { CompositionSession } from '../types';
import { CANONICAL_TRACKS } from './canonicalCatalog';

export const INITIAL_COMPOSITION_SESSIONS: CompositionSession[] = [
  {
    id: 'SES-01',
    name: 'Brick by Brick — Boom-Bap MPC v5.5 Refinement',
    trackId: 'TRK-01',
    trackTitle: 'Brick by Brick',
    ep: 'EP 1: Restoration',
    createdAt: '2026-09-10T14:20:00.000Z',
    updatedAt: '2026-09-16T16:45:00.000Z',
    activeTab: 'lyrics',
    description: 'Refined bridge cadence and locked Suno v5.5 engine sliders to MPC swing with The Architect vocal delivery.',
    tags: ['Boom-Bap', 'Suno v5.5', 'MPC Swing', 'Theology Audit'],
    isPinned: true,
    color: '#6366f1', // Indigo
    snapshot: {
      lyrics: CANONICAL_TRACKS[0]?.lyrics || '',
      sunoPrompt: CANONICAL_TRACKS[0]?.sunoPrompt || '',
      negativePrompt: CANONICAL_TRACKS[0]?.negativePrompt || '',
      engineSliders: CANONICAL_TRACKS[0]?.engineSliders || { weirdness: 12, styleInfluence: 65, voiceAudio: 100 },
      bpm: CANONICAL_TRACKS[0]?.bpm || 88,
      key: CANONICAL_TRACKS[0]?.key || 'D Minor',
      genre: CANONICAL_TRACKS[0]?.genre || 'Christian Hip Hop / Boom-Bap',
      vocal: CANONICAL_TRACKS[0]?.vocal || 'The Architect',
      vocalCast: CANONICAL_TRACKS[0]?.vocalCast || 'The Architect (Sub-Sonic Quarry)',
      thesis: CANONICAL_TRACKS[0]?.thesis || "The label's foundation; Brokenness Redeemed In Christ's Kingdom.",
      selahPrayed: true,
      status: 'Audio Master',
      notes: 'Master stems processed through BS-Roformer; Suno prompt ready for next iteration pass.',
      versionsCount: CANONICAL_TRACKS[0]?.versions?.length || 2,
      latestVersionTag: 'v2.0'
    }
  },
  {
    id: 'SES-02',
    name: 'Cornerstone — Soul Gospel B3 Organ Swell Pass',
    trackId: 'TRK-02',
    trackTitle: 'Cornerstone',
    ep: 'EP 1: Restoration',
    createdAt: '2026-09-12T10:15:00.000Z',
    updatedAt: '2026-09-15T18:30:00.000Z',
    activeTab: 'mixer',
    description: 'Ms T deep alto chest resonance testing with Hammond B3 Leslie swell dynamics and Selah prayer integration.',
    tags: ['Soul Gospel', 'Ms T', 'B3 Organ', 'Selah Block'],
    isPinned: true,
    color: '#8b5cf6', // Purple
    snapshot: {
      lyrics: CANONICAL_TRACKS[1]?.lyrics || '',
      sunoPrompt: CANONICAL_TRACKS[1]?.sunoPrompt || '',
      negativePrompt: CANONICAL_TRACKS[1]?.negativePrompt || '',
      engineSliders: CANONICAL_TRACKS[1]?.engineSliders || { weirdness: 18, styleInfluence: 75, voiceAudio: 90 },
      bpm: CANONICAL_TRACKS[1]?.bpm || 72,
      key: CANONICAL_TRACKS[1]?.key || 'Bb Major',
      genre: CANONICAL_TRACKS[1]?.genre || 'Gospel / Soul Worship',
      vocal: CANONICAL_TRACKS[1]?.vocal || 'Ms T',
      vocalCast: CANONICAL_TRACKS[1]?.vocalCast || 'Ms T (Deep Alto Chest-Voice)',
      thesis: CANONICAL_TRACKS[1]?.thesis || 'The stone the builders rejected has become the cornerstone.',
      selahPrayed: true,
      status: 'In Progress',
      notes: 'Testing choir call-and-response tags in the final vamp.',
      versionsCount: CANONICAL_TRACKS[1]?.versions?.length || 1,
      latestVersionTag: 'v1.2'
    }
  },
  {
    id: 'SES-03',
    name: 'Iron Sharpens Iron — Industrial Hard Rock Guitar Pass',
    trackId: 'TRK-09',
    trackTitle: 'Iron Sharpens Iron',
    ep: 'EP 2: Conflict Suite',
    createdAt: '2026-09-14T09:00:00.000Z',
    updatedAt: '2026-09-16T12:10:00.000Z',
    activeTab: 'lyrics',
    description: 'Kane high-octane raspy delivery over drop-D baritone guitars. Theological check on accountability verses.',
    tags: ['Hard Rock', 'Kane', 'Drop-D', 'War Room'],
    isPinned: false,
    color: '#f59e0b', // Amber
    snapshot: {
      lyrics: CANONICAL_TRACKS[8]?.lyrics || '',
      sunoPrompt: CANONICAL_TRACKS[8]?.sunoPrompt || '',
      negativePrompt: CANONICAL_TRACKS[8]?.negativePrompt || '',
      engineSliders: CANONICAL_TRACKS[8]?.engineSliders || { weirdness: 25, styleInfluence: 80, voiceAudio: 85 },
      bpm: CANONICAL_TRACKS[8]?.bpm || 138,
      key: CANONICAL_TRACKS[8]?.key || 'E Minor',
      genre: CANONICAL_TRACKS[8]?.genre || 'Christian Hard Rock / Industrial Metal',
      vocal: CANONICAL_TRACKS[8]?.vocal || 'Kane',
      vocalCast: CANONICAL_TRACKS[8]?.vocalCast || 'Kane (Tectonic Powerhouse)',
      thesis: CANONICAL_TRACKS[8]?.thesis || 'As iron sharpens iron, so one person sharpens another.',
      selahPrayed: false,
      status: 'In Progress',
      notes: 'Heavy distortion gate on guitar bus; verse 2 vocal phrasing locked.',
      versionsCount: CANONICAL_TRACKS[8]?.versions?.length || 1,
      latestVersionTag: 'v1.0'
    }
  },
  {
    id: 'SES-04',
    name: 'City of God — Neon Gospel Worship & Shorts Cut',
    trackId: 'TRK-24',
    trackTitle: 'City of God',
    ep: 'EP 4: Surrender Sessions',
    createdAt: '2026-09-15T15:30:00.000Z',
    updatedAt: '2026-09-16T15:00:00.000Z',
    activeTab: 'youtube',
    description: 'Finalizing 60s viral hook for YouTube Shorts & TikTok, syncing NightCafe visual storyboard with lyric drop.',
    tags: ['OmniPost', 'YouTube Shorts', 'Neon Gospel', 'Viral Hook'],
    isPinned: false,
    color: '#06b6d4', // Cyan
    snapshot: {
      lyrics: CANONICAL_TRACKS[23]?.lyrics || '',
      sunoPrompt: CANONICAL_TRACKS[23]?.sunoPrompt || '',
      negativePrompt: CANONICAL_TRACKS[23]?.negativePrompt || '',
      engineSliders: CANONICAL_TRACKS[23]?.engineSliders || { weirdness: 10, styleInfluence: 70, voiceAudio: 95 },
      bpm: CANONICAL_TRACKS[23]?.bpm || 128,
      key: CANONICAL_TRACKS[23]?.key || 'C Major',
      genre: CANONICAL_TRACKS[23]?.genre || 'Neon Gospel / Cinematic Pop',
      vocal: CANONICAL_TRACKS[23]?.vocal || 'The Pop Prodigy',
      vocalCast: CANONICAL_TRACKS[23]?.vocalCast || 'The Pop Prodigy (Hyper-Pop Shimmer)',
      thesis: CANONICAL_TRACKS[23]?.thesis || 'The eternal reign of the New Jerusalem.',
      selahPrayed: true,
      status: 'Sent for Distribution',
      notes: 'Viral hook at 0:45 selected for 15k fitness & worship dance challenge.',
      versionsCount: CANONICAL_TRACKS[23]?.versions?.length || 3,
      latestVersionTag: 'v3.0'
    }
  }
];
