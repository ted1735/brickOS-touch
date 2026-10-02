import { NextcloudFolderAsset, NextcloudAssetCategory, MixerTrack, Track } from '../types';
import { buildNextcloudStreamUrl } from '../utils/nextcloudStream';

export const NEXTCLOUD_BASE_WEBDAV = 'https://nextcloud.mermaid-symmetric.ts.net/remote.php/dav/files/ncted/Music-Production';
export const NEXTCLOUD_SHARE_ROOT = 'https://nextcloud.mermaid-symmetric.ts.net/index.php/apps/files/files/207332?dir=/Music-Production';
export const NEXTCLOUD_FALLBACK_BASE_WEBDAV = 'https://nextcloud.moyercloud.com/remote.php/dav/files/ncted/Music-Production';

export interface TrackNextcloudDefinition {
  trackId: string;
  title: string;
  folderName: string;
  aliases: string[];
  bpm: number;
  key: string;
  genre: string;
  vocal: string;
  versions: Array<{
    tag: string;
    styleName: string;
    notes: string;
  }>;
  stems: Array<{
    id: number;
    name: string;
    stemFilename: string;
    stemType: 'vocal' | 'choir' | 'organ' | 'piano' | 'guitar' | 'drums' | 'bass' | 'master';
    color: string;
    freq: number;
    waveType: OscillatorType;
  }>;
  visualTitle: string;
  sceneTitle: string;
}

export const CATALOG_TRACK_DEFINITIONS: TrackNextcloudDefinition[] = [
  {
    trackId: 'TRK-01',
    title: 'Brick by Brick',
    folderName: 'Brick-by-Brick',
    aliases: ['TRK-01', 'Brick-by-Brick', 'Brick_by_Brick', 'Brick by Brick', 'BBB', 'BrickByBrick', '00-Active_Projects/Brick-by-Brick'],
    bpm: 88,
    key: 'D Minor',
    genre: 'Christian Hip Hop / Boom-Bap',
    vocal: 'The Architect',
    versions: [
      { tag: 'v3.5', styleName: 'Extended Remastered Cut', notes: 'Gritty MPC swing, warm upright bass, authentic male rap vocal.' },
      { tag: 'v2.5', styleName: 'Original Boom-Bap Cut', notes: 'Raw spoken word sketch with vinyl crackle.' }
    ],
    stems: [
      { id: 1, name: 'Track 1: Extended Remastered Cut (FLAC)', stemFilename: 'Brick-by-Brick-Extended-Remastered-_02-44-v3.5.flac', stemType: 'master', color: '#6366f1', freq: 146.83, waveType: 'sawtooth' },
      { id: 2, name: 'Track 2: Original Boom-Bap Cut v2.5 (MP3)', stemFilename: 'Brick-by-Brick_02-53-v2.5.mp3', stemType: 'drums', color: '#10b981', freq: 220, waveType: 'square' },
      { id: 3, name: 'Track 3: Extended Cut v3.5 (MP3)', stemFilename: 'Brick-by-Brick-Extended_02-44-v3.5.mp3', stemType: 'piano', color: '#f59e0b', freq: 110, waveType: 'triangle' },
      { id: 4, name: 'Track 4: Dry Rewrite Version v15.75 (MP3)', stemFilename: 'Brick-By-Brick-v15.75-dry-rewrite.mp3', stemType: 'vocal', color: '#ec4899', freq: 293.66, waveType: 'sine' }
    ],
    visualTitle: 'Ruins to Blueprint Kintsugi Brickwork',
    sceneTitle: 'Streets Hum a Hymn - Morning Construction'
  },
  {
    trackId: 'TRK-02',
    title: "The Master's Hand",
    folderName: 'The-Masters-Hand',
    aliases: ['TRK-02', 'The-Masters-Hand', 'Masters_Hand', "The Master's Hand", 'The_Masters_Hand', 'TMH', '00-Active_Projects/The-Masters-Hand'],
    bpm: 140,
    key: 'F# Minor',
    genre: 'Melodic Dubstep / Spoken Word',
    vocal: 'Brandon / Silas Thorne',
    versions: [
      { tag: 'v3.0a', styleName: 'Heavy Melodic Drop Master', notes: 'Massive supersaws, filtered drops, wood lathe foley, raw spoken word intro.' },
      { tag: 'v2.1', styleName: 'Acoustic Woodshop Narrative', notes: 'Weathered cedar acoustic fingerpicking.' }
    ],
    stems: [
      { id: 1, name: "Track 1: Master's Hand v3.0a Remastered", stemFilename: 'The-Masters-Hand-v3.0a-Remastered.mp3', stemType: 'master', color: '#6366f1', freq: 185, waveType: 'sawtooth' },
      { id: 2, name: "Track 2: Master's Hand v2.1 Remastered", stemFilename: 'The-Masters-Hand-v2.1-Remastered.mp3', stemType: 'organ', color: '#10b981', freq: 370, waveType: 'triangle' },
      { id: 3, name: "Track 3: Master's Hand v2.5 Original Cut", stemFilename: 'The Masters Hand- v2.5.mp3', stemType: 'guitar', color: '#f59e0b', freq: 277.18, waveType: 'sine' },
      { id: 4, name: 'Track 4: The Grain of the Wood v1.0', stemFilename: 'The-Grain-of-the-Wood-v1.0_02-07.mp3', stemType: 'vocal', color: '#ec4899', freq: 92.5, waveType: 'square' }
    ],
    visualTitle: 'Weathered Cedar Woodshop Golden Hour',
    sceneTitle: 'The Lathe and the Fire Sanctification'
  },
  {
    trackId: 'TRK-03',
    title: "Every Candle's Victory",
    folderName: 'Every-Candles-Victory',
    aliases: ['ECV', 'Every-Candles-Victory', 'Every_Candles_Victory', "Every Candle's Victory", 'Every Candles Victory', 'TRK-03', 'Candle', '00-Active_Projects/Every-Candles-Victory'],
    bpm: 78,
    key: 'G Major',
    genre: 'Soulful Country-Rock / Gospel',
    vocal: 'Mrs T / Brandon / Gospel Choir',
    versions: [
      { tag: 'v2.1', styleName: 'Gospel Group Shout Master', notes: 'Warm Hammond organ swell, gentle gospel piano chords, vocal ad-libs, explosive full choir finale.' },
      { tag: 'v2.0', styleName: 'Solo Tribute Acoustic', notes: 'Original intimate solo vocal and piano tribute to cancer survival.' }
    ],
    stems: [
      { id: 1, name: "Track 1: Every Candle's Victory Gospel v2.1", stemFilename: 'Every-Candles-Victory-Gospel-v2.1.mp3', stemType: 'master', color: '#6366f1', freq: 196, waveType: 'sawtooth' },
      { id: 2, name: "Track 2: Every Candle's Victory Gospel v2.0", stemFilename: 'Every-Candles-Victory-Gospel-v2.0.mp3', stemType: 'choir', color: '#10b981', freq: 246.94, waveType: 'triangle' },
      { id: 3, name: "Track 3: Gospel Instrumental Resonance", stemFilename: 'Every-Candles-Victory-Gospel-v2.1.mp3', stemType: 'organ', color: '#f59e0b', freq: 293.66, waveType: 'sine' },
      { id: 4, name: "Track 4: Choir & Worship Bed", stemFilename: 'Every-Candles-Victory-Gospel-v2.0.mp3', stemType: 'guitar', color: '#ec4899', freq: 392, waveType: 'sawtooth' }
    ],
    visualTitle: 'Golden Beeswax Candle in Sanctuary Chiaroscuro',
    sceneTitle: 'Underneath the Open Skies Cancer Survivor Testimony'
  },
  {
    trackId: 'TRK-04',
    title: 'Nothing But The Blood',
    folderName: 'Nothing-But-the-Blood',
    aliases: ['TRK-04', 'Nothing-But-the-Blood', 'Nothing_But_The_Blood', 'Nothing But The Blood', 'NBTB', '00-Active_Projects/Nothing-But-the-Blood'],
    bpm: 110,
    key: 'E Minor',
    genre: 'EDM / Hip-Hop / Rock Reimagining',
    vocal: 'Mrs T / Kane',
    versions: [
      { tag: 'v3.0b', styleName: 'Modern Worship Leader Master', notes: 'Driving 808 bass, trap hi-hat rolls, distorted electric guitar riffs.' },
      { tag: 'v12.55', styleName: 'Mrs T Gospel Anthem Master', notes: 'Intimate gospel roots with electronic undertones.' }
    ],
    stems: [
      { id: 1, name: 'Track 1: Modern NBTB Worship Leader v3.0b', stemFilename: 'NBTB-v3.0b_Modern_Nothing_but_the_Blood__Worship_Leader_-d9fd77e9-91d0-4fbc-8620-eb53d66c284b.mp3', stemType: 'master', color: '#6366f1', freq: 164.81, waveType: 'sawtooth' },
      { id: 2, name: 'Track 2: Modern NBTB Worship Leader v2.86 Remaster', stemFilename: 'NBTB-v2.86_Modern_Nothing_but_the_Blood_-The__Worship_Leader__Edit-_-Remastered-f03c878f-e28a-4794-912b-256eb3d6e925.mp3', stemType: 'vocal', color: '#10b981', freq: 329.63, waveType: 'square' },
      { id: 3, name: 'Track 3: Mrs T Gospel Anthem v12.55 Remastered', stemFilename: 'v12.55-Nothing-But-the-Blood-Mrs-T-Gospel-Anthem-Remastered.mp3', stemType: 'choir', color: '#f59e0b', freq: 246.94, waveType: 'sawtooth' },
      { id: 4, name: 'Track 4: Mrs T Gospel Anthem v12.5 (04:04)', stemFilename: 'Nothing-But-the-Blood-Mrs-T-Gospel-Anthem_04-04-v12.5.mp3', stemType: 'drums', color: '#ec4899', freq: 82.41, waveType: 'triangle' }
    ],
    visualTitle: 'Ancient Weathered Cedar Cross at Dawn',
    sceneTitle: 'Scarlet River Over Dark Timber Valley'
  },
  {
    trackId: 'TRK-05',
    title: 'The Higher Measure',
    folderName: '00-Active_Projects',
    aliases: ['TRK-05', 'The-Higher-Measure', 'The_Higher_Measure', 'The Higher Measure', 'THM', '00-Active_Projects/The-Higher-Measure'],
    bpm: 104,
    key: 'D Major',
    genre: 'Anthemic Worship Pop',
    vocal: 'Brandon / Worship Collective',
    versions: [
      { tag: 'v11.5', styleName: 'Persona Upbeat Master FLAC', notes: 'Big acoustic drums, soaring lead vocal, shimmering acoustic rhythm.' }
    ],
    stems: [
      { id: 1, name: 'Track 1: Blueprint & Blood Upbeat Remaster (FLAC)', stemFilename: 'v11.5-The-Blueprint-and-the-Blood-Persona-Upbeat-Remastered.flac', stemType: 'master', color: '#6366f1', freq: 146.83, waveType: 'sawtooth' },
      { id: 2, name: 'Track 2: Glitter Gritty Rock v3.0 (FLAC)', stemFilename: 'Glitter-Gritty-Rock-v3.0.flac', stemType: 'guitar', color: '#10b981', freq: 293.66, waveType: 'triangle' },
      { id: 3, name: "Track 3: Master's Hand v2.1 Remaster (FLAC)", stemFilename: 'The-Masters-Hand-v2.1-Remastered.flac', stemType: 'organ', color: '#f59e0b', freq: 220, waveType: 'sine' },
      { id: 4, name: 'Track 4: Modern NBTB Edit (FLAC)', stemFilename: 'v2.86-Modern-Nothing-but-the-Blood.flac', stemType: 'drums', color: '#ec4899', freq: 73.42, waveType: 'square' }
    ],
    visualTitle: 'Golden Architect Measuring Line Over Foundations',
    sceneTitle: 'Ascending Mount Zion at First Light'
  },
  {
    trackId: 'TRK-06',
    title: 'Break the Bond / Correction is Restoration',
    folderName: 'Blindfold-Blessing',
    aliases: ['TRK-06', 'Break-the-Bond', 'Break_the_Bond', 'Correction-is-Restoration', 'Correction_is_Restoration', 'BTB', 'CIR', '00-Active_Projects/Break-the-Bond'],
    bpm: 92,
    key: 'C Minor',
    genre: 'Cinematic Urban Gospel',
    vocal: 'Mrs T',
    versions: [
      { tag: 'v2.0', styleName: 'CEDM Punch Master', notes: 'Heavy orchestral strings, thunderous tympani, and prophetic alto vocals.' }
    ],
    stems: [
      { id: 1, name: 'Track 1: Blindfold Blessing CEDM Punch Master', stemFilename: 'Blindfold_Blessing_CEDM-PUNCH.mp3', stemType: 'master', color: '#6366f1', freq: 130.81, waveType: 'sawtooth' },
      { id: 2, name: 'Track 2: Heavy Sub Bass & Drop Accent', stemFilename: 'Blindfold_Blessing_CEDM-PUNCH.mp3', stemType: 'bass', color: '#10b981', freq: 261.63, waveType: 'triangle' },
      { id: 3, name: 'Track 3: Lead Synth & Alto Vocal Core', stemFilename: 'Blindfold_Blessing_CEDM-PUNCH.mp3', stemType: 'vocal', color: '#f59e0b', freq: 196, waveType: 'sine' },
      { id: 4, name: 'Track 4: Stomp Percussion & Room Plate', stemFilename: 'Blindfold_Blessing_CEDM-PUNCH.mp3', stemType: 'drums', color: '#ec4899', freq: 65.4, waveType: 'square' }
    ],
    visualTitle: 'Shattered Iron Chains on Temple Flagstones',
    sceneTitle: 'The Altar of Restoration and Release'
  },
  {
    trackId: 'TRK-07',
    title: 'Leaning Not Leaving',
    folderName: 'Leaning-Not-Leaving',
    aliases: ['TRK-07', 'Leaning-Not-Leaving', 'Leaning_Not_Leaving', 'Leaning Not Leaving', 'LNL', '00-Active_Projects/Leaning-Not-Leaving'],
    bpm: 72,
    key: 'C Major',
    genre: 'Intimate Devotional Acoustic',
    vocal: 'Brandon',
    versions: [
      { tag: 'v7.5', styleName: 'Worship Group Master (FLAC)', notes: 'Pure acoustic guitar, upright bass, and intimate devotional vocal.' },
      { tag: 'v6.6', styleName: 'Worship Group Remastered', notes: 'Full sanctuary acoustic recording.' }
    ],
    stems: [
      { id: 1, name: 'Track 1: Real Isolated Vocals (UVR5 FLAC)', stemFilename: '1776198861_1_LNL-v5.5-v1aa-Remastered-_-Vocals.flac', stemType: 'vocal', color: '#6366f1', freq: 130.81, waveType: 'sine' },
      { id: 2, name: 'Track 2: Real Isolated Instrumental Bed (FLAC)', stemFilename: '1776198861_1_LNL-v5.5-v1aa-Remastered-_-Instrumental.flac', stemType: 'guitar', color: '#10b981', freq: 261.63, waveType: 'triangle' },
      { id: 3, name: 'Track 3: Worship Group v7.5 Gold Master (FLAC)', stemFilename: 'Leaning-Not-Leaving-v7.5-Worship-Group.flac', stemType: 'master', color: '#f59e0b', freq: 196, waveType: 'sawtooth' },
      { id: 4, name: 'Track 4: Worship Group v6.6 Remastered (MP3)', stemFilename: 'Leaning-Not-Leaving-v6.6-Worship-Group-Remastered.mp3', stemType: 'choir', color: '#ec4899', freq: 65.4, waveType: 'square' }
    ],
    visualTitle: 'Open Bible on Weathered Oak Bench in Sunlight',
    sceneTitle: 'Morning Sanctuary Stillness'
  },
  {
    trackId: 'TRK-08',
    title: 'Check Your Heart Light',
    folderName: 'CheckYourHeartLight',
    aliases: ['TRK-08', 'Check-Your-Heart-Light', 'Check_Your_Heart_Light', 'Check Your Heart Light', 'CYHL', 'CheckYourHeartLight', '00-Active_Projects/Check-Your-Heart-Light'],
    bpm: 104,
    key: 'G Major',
    genre: 'Neo-Soul Gospel Funk',
    vocal: 'Mrs T & The Saints',
    versions: [
      { tag: 'v1.0', styleName: 'Swamptronica Master', notes: 'Gritty bayou acoustic slide guitar with electronic groove.' }
    ],
    stems: [
      { id: 1, name: 'Track 1: Check That Heart Light Swamptronica v1.0', stemFilename: 'Check That Heart Light 🚨 v1.0 Swamptronica .mp3', stemType: 'master', color: '#6366f1', freq: 196, waveType: 'sawtooth' },
      { id: 2, name: 'Track 2: Check That Heart Light Radio Cut (6s)', stemFilename: '6s Check That Heart Light 🚨 v1.0 Swamptronica .mp3', stemType: 'organ', color: '#10b981', freq: 392, waveType: 'triangle' },
      { id: 3, name: 'Track 3: Swamptronica Instrumental Bed', stemFilename: 'Check That Heart Light 🚨 v1.0 Swamptronica .mp3', stemType: 'guitar', color: '#f59e0b', freq: 293.66, waveType: 'sine' },
      { id: 4, name: 'Track 4: Vocal Groove & Soul Percussion', stemFilename: '6s Check That Heart Light 🚨 v1.0 Swamptronica .mp3', stemType: 'drums', color: '#ec4899', freq: 98, waveType: 'square' }
    ],
    visualTitle: 'Vintage Amber Radio Dial and Glowing Tube Amp',
    sceneTitle: 'The Gospel Highway Neon Glow'
  },
  {
    trackId: 'TRK-09',
    title: 'Glitter',
    folderName: 'Glitter',
    aliases: ['TRK-09', 'Glitter', 'GLIT', '00-Active_Projects/Glitter'],
    bpm: 112,
    key: 'A Major',
    genre: 'High-Energy Pop / Romantic Soul',
    vocal: 'The Pop Prodigy / Monica',
    versions: [
      { tag: 'v1.56', styleName: 'Electronic Pop Master Remastered', notes: 'Shimmering guitars, sparkling brass hooks, anthemic dancefloor groove.' },
      { tag: 'v3.5', styleName: 'Country Cut v3.5', notes: 'Intimate piano sketch and soft shaker rhythm.' }
    ],
    stems: [
      { id: 1, name: 'Track 1: Glitter Electronic Pop v1.56 Remastered', stemFilename: 'Glitter-1.56-Star-Electronic-Pop-Remastered.mp3', stemType: 'master', color: '#6366f1', freq: 220, waveType: 'sawtooth' },
      { id: 2, name: 'Track 2: Glitter Electronic Pop v1.55 Remastered', stemFilename: 'Glitter_-Glitter_1.55_Star_Electronic_Pop_-Remastered-d91749d7-9e9b-48ea-88f6-f60f1ab6f0ed.mp3', stemType: 'organ', color: '#10b981', freq: 440, waveType: 'triangle' },
      { id: 3, name: 'Track 3: Glitter Country Cut v3.5', stemFilename: 'Glitter-Country-v3.5 6.5s.mp3', stemType: 'guitar', color: '#f59e0b', freq: 277.18, waveType: 'sine' },
      { id: 4, name: 'Track 4: Piano Solo by Ted Moyer', stemFilename: 'Glitter_-6.5s_Glitter_V8_Piano_Solo_by_Ted_Moyer_-29535ff7-ab6f-44dc-9130-6d6c205e301c.mp3', stemType: 'piano', color: '#ec4899', freq: 110, waveType: 'square' }
    ],
    visualTitle: 'Prismatic Light Refracting Through Stained Glass & Quartz',
    sceneTitle: 'Joyful Radiance in the Midst of the City'
  },
  {
    trackId: 'TRK-10',
    title: 'The Blueprint & The Blood',
    folderName: 'The-Blueprint-and-The-Blood',
    aliases: ['TRK-10', 'The-Blueprint-and-The-Blood', 'The_Blueprint_and_The_Blood', 'The Blueprint & The Blood', 'BPB', '00-Active_Projects/The-Blueprint-and-The-Blood'],
    bpm: 92,
    key: 'G Major',
    genre: 'Blue-Collar Heartland Rock / Acoustic',
    vocal: 'Brandon & The Architect',
    versions: [
      { tag: 'v5.2', styleName: 'Gold Remastered Master (FLAC)', notes: 'Telecaster riffs, gritty male harmony, pounding kick drum, working-man anthemic chorus.' },
      { tag: 'v8.0', styleName: 'Persona Upbeat Master (FLAC)', notes: 'Solo acoustic guitar and gravel vocal.' }
    ],
    stems: [
      { id: 1, name: 'Track 1: Blueprint & Blood v5.2 Remastered (FLAC)', stemFilename: '6.2sr_The_Blueprint_and_the_Blood_v5.2_-Remastered-_03-48.flac', stemType: 'master', color: '#6366f1', freq: 196, waveType: 'sawtooth' },
      { id: 2, name: 'Track 2: Persona Upbeat Master v8.0 (FLAC)', stemFilename: 'The_Blueprint_and_the_Blood_v8_Persona_Upbeat_05-18.flac', stemType: 'guitar', color: '#10b981', freq: 392, waveType: 'square' },
      { id: 3, name: 'Track 3: Persona Upbeat Remaster v11.6 (MP3)', stemFilename: 'v11.6-The-Blueprint-and-the-Blood-Persona-Upbeat-Remastered.mp3', stemType: 'organ', color: '#f59e0b', freq: 293.66, waveType: 'sine' },
      { id: 4, name: 'Track 4: Persona Upbeat v10 Remastered (MP3)', stemFilename: 'The-Blueprint-and-the-Blood-v10-Remastered-_04-45.mp3', stemType: 'drums', color: '#ec4899', freq: 98, waveType: 'triangle' }
    ],
    visualTitle: 'Architect Blueprint Laid Across Weathered Wood Workshop Bench',
    sceneTitle: 'Foundations Poured in Truth'
  },
  {
    trackId: 'TRK-11',
    title: 'Unity in the Friction',
    folderName: 'Unity-In-The-Friction',
    aliases: ['TRK-11', 'Unity-In-The-Friction', 'Unity_in_the_Friction', 'Unity in the Friction', 'UIF', '00-Active_Projects/Unity-In-The-Friction'],
    bpm: 128,
    key: 'C# Minor',
    genre: 'Christian Hip Hop / Trap-Gospel Duet',
    vocal: 'Kane & Monica',
    versions: [
      { tag: 'v3.0', styleName: 'Gold Master (FLAC)', notes: 'Aggressive 808 slides, blistering male/female back-and-forth cypher, choir hook.' }
    ],
    stems: [
      { id: 1, name: 'Track 1: Ted Moyer Unity GOLD MASTER (FLAC)', stemFilename: 'Ted_Moyer_Unity_GOLD_MASTER.flac', stemType: 'master', color: '#6366f1', freq: 138.59, waveType: 'sawtooth' },
      { id: 2, name: 'Track 2: Unity TED MOYER GOLD MASTER (WAV)', stemFilename: 'Unity_TED_MOYER_GOLD_MASTER.wav', stemType: 'bass', color: '#10b981', freq: 69.3, waveType: 'sine' },
      { id: 3, name: 'Track 3: Unity in the Friction v3 Mastered UN30 CHH', stemFilename: 'Unity-in-the-Friction-v3MASTERED-UN30-CHH.wav', stemType: 'choir', color: '#f59e0b', freq: 277.18, waveType: 'triangle' },
      { id: 4, name: 'Track 4: Ted Moyer Unity FINAL (MP3)', stemFilename: 'Ted_Moyer_Unity_FINAL.mp3', stemType: 'drums', color: '#ec4899', freq: 138.59, waveType: 'square' }
    ],
    visualTitle: 'Iron Sharpening Iron Sparks Flying in Blacksmith Forge',
    sceneTitle: 'Two Voices Standing in the Fire'
  },
  {
    trackId: 'TRK-12',
    title: 'The Anchor',
    folderName: 'The-Anchor',
    aliases: ['TRK-12', 'The-Anchor', 'The_Anchor', 'The Anchor', 'ANCH', '00-Active_Projects/The-Anchor'],
    bpm: 72,
    key: 'Bb Major',
    genre: 'Cinematic Worship / Emotional Ballad',
    vocal: 'PATD',
    versions: [
      { tag: 'v17a', styleName: 'BMV3 Gold Master (FLAC)', notes: 'Full orchestral strings, delicate grand piano intro rising into massive climactic vocal belt.' }
    ],
    stems: [
      { id: 1, name: 'Track 1: Real Isolated Vocals Stem (FLAC)', stemFilename: '1776980538_1_The_Anchor_v4b_FIXED_-Vocals.flac', stemType: 'vocal', color: '#6366f1', freq: 233.08, waveType: 'sawtooth' },
      { id: 2, name: 'Track 2: Real Isolated Drums Stem (FLAC)', stemFilename: '1776980538_1_The_Anchor_v4b_FIXED_-Drums.flac', stemType: 'drums', color: '#10b981', freq: 466.16, waveType: 'sine' },
      { id: 3, name: 'Track 3: Real Isolated Bass Stem (FLAC)', stemFilename: '1776980538_1_The_Anchor_v4b_FIXED_-Bass.flac', stemType: 'bass', color: '#f59e0b', freq: 349.23, waveType: 'triangle' },
      { id: 4, name: 'Track 4: Real Isolated Instrumental Bed (FLAC)', stemFilename: '1776980538_1_The_Anchor_v4b_FIXED_-Instrumental.flac', stemType: 'master', color: '#ec4899', freq: 58.27, waveType: 'square' }
    ],
    visualTitle: 'Heavy Iron Anchor Sunk Deep in Bedrock Under Crashing Waves',
    sceneTitle: 'Unshakable in the Storm'
  },
  {
    trackId: 'TRK-13',
    title: 'Calvary Grit',
    folderName: 'Calvary-Grit',
    aliases: ['TRK-13', 'Calvary-Grit', 'Calvary_Grit', 'Calvary Grit', 'CG', '00-Active_Projects/Calvary-Grit'],
    bpm: 138,
    key: 'D Minor',
    genre: 'Southern Rock / Blue-Collar Testimony',
    vocal: 'Brandon / Dual Harmony',
    versions: [
      { tag: 'v4.55a', styleName: 'Team Edit Remastered (FLAC)', notes: 'Grit electric slide guitar, stomping rhythm, southern vocal growl.' }
    ],
    stems: [
      { id: 1, name: 'Track 1: Calvary Grit v4.55a Remastered (FLAC)', stemFilename: 'Calvary-Grit-V4.55a-Team-Edit-Remastered.flac', stemType: 'master', color: '#6366f1', freq: 146.83, waveType: 'sawtooth' },
      { id: 2, name: 'Track 2: Calvary Grit v4.55b Remastered (FLAC)', stemFilename: 'Calvary-Grit-V4.55b-Team-Edit-Remastered.flac', stemType: 'guitar', color: '#10b981', freq: 293.66, waveType: 'triangle' },
      { id: 3, name: 'Track 3: Calvary Grit v4.15 Edit Remastered (MP3)', stemFilename: 'Calvary-Grit-V4.15-Edit-Remastered.mp3', stemType: 'organ', color: '#f59e0b', freq: 220, waveType: 'sine' },
      { id: 4, name: 'Track 4: Calvary Grit v3.6 Original (MP3)', stemFilename: 'Calvary-Grit-V3.6.mp3', stemType: 'drums', color: '#ec4899', freq: 73.42, waveType: 'square' }
    ],
    visualTitle: 'Red Clay Quarry and Weathered Cedar Timbers',
    sceneTitle: 'Truck Bed Sunset Over Cross Ridgeline'
  },
  {
    trackId: 'TRK-14',
    title: 'Venom Into Victory',
    folderName: 'Venom-into-Victory',
    aliases: ['TRK-14', 'Venom-Into-Victory', 'Venom_Into_Victory', 'Venom Into Victory', 'VIV', 'Venom-into-Victory', '00-Active_Projects/Venom-Into-Victory'],
    bpm: 132,
    key: 'F Minor',
    genre: 'K-Pop Fusion / Hyper-Pop CHH',
    vocal: 'The Pop Prodigy',
    versions: [
      { tag: 'v2.6a', styleName: 'Identity Anthem Gold Master', notes: 'Rapid-fire vocal runs, razor synths, high-intensity rhythm, explosive bass drop.' }
    ],
    stems: [
      { id: 1, name: 'Track 1: Venom Into Victory Gold Master (FLAC)', stemFilename: 'Venom_Into_Victory.flac', stemType: 'master', color: '#6366f1', freq: 174.61, waveType: 'sawtooth' },
      { id: 2, name: 'Track 2: Identity Anthem v2.6a Remastered (MP3)', stemFilename: 'Venom-Into-Victory-V2.6a-BMV-3.1-Identity-Anthem-Remastered.mp3', stemType: 'organ', color: '#10b981', freq: 349.23, waveType: 'square' },
      { id: 3, name: 'Track 3: Boba His Work Master (MP3)', stemFilename: 'BOBA_HIS_WORK_MASTER.mp3', stemType: 'bass', color: '#f59e0b', freq: 87.31, waveType: 'triangle' },
      { id: 4, name: 'Track 4: Venom Into Victory Radio MP3', stemFilename: 'Venom_Into_Victory.mp3', stemType: 'drums', color: '#ec4899', freq: 87.31, waveType: 'square' }
    ],
    visualTitle: 'Shattered Serpent Skull Turned to Pure Gold',
    sceneTitle: 'Triumphant Step Over the Adversary'
  },
  {
    trackId: 'TRK-15',
    title: 'The Final Say',
    folderName: 'The-Final-Say',
    aliases: ['TRK-15', 'The-Final-Say', 'The_Final_Say', 'The Final Say', 'TFS', '00-Active_Projects/The-Final-Say'],
    bpm: 74,
    key: 'Eb Major',
    genre: 'Cinematic Stadium Worship',
    vocal: 'Ms T',
    versions: [
      { tag: 'v3.0b', styleName: 'BMV3 Gold Master (FLAC)', notes: 'Thundering floor toms, soaring French horns, Ms T declaring divine sovereignty.' }
    ],
    stems: [
      { id: 1, name: 'Track 1: The Final Say v3b BMV3 Master (FLAC)', stemFilename: 'The_Final_Say_v3b_BMV3_MASTER.flac', stemType: 'master', color: '#6366f1', freq: 155.56, waveType: 'sawtooth' },
      { id: 2, name: 'Track 2: The Final Say v3ba Remastered (MP3)', stemFilename: 'The-Final-Say-ba-BMV-3-Remastered.mp3', stemType: 'organ', color: '#10b981', freq: 311.13, waveType: 'sine' },
      { id: 3, name: 'Track 3: The Final Say BuildUP v3.2b (MP3)', stemFilename: 'The-Final-Say-BuildUP-v3.2b-BMV-2-Remastered.mp3', stemType: 'piano', color: '#f59e0b', freq: 233.08, waveType: 'triangle' },
      { id: 4, name: 'Track 4: The Final Say v3bb Remastered (MP3)', stemFilename: 'The-Final-Say-bb-BMV-3-Remastered.mp3', stemType: 'drums', color: '#ec4899', freq: 77.78, waveType: 'square' }
    ],
    visualTitle: 'Lion of Judah Silhouette on Ridge at Golden Twilight',
    sceneTitle: 'The Verdict from the Throne Room'
  },
  {
    trackId: 'TRK-16',
    title: 'Meet Me Here',
    folderName: 'Meet_Me_Here',
    aliases: ['TRK-16', 'Meet_Me_Here', 'Meet-Me-Here', 'Meet Me Here', 'MMH', 'SOV-002', '00-Active_Projects/Meet_Me_Here'],
    bpm: 76,
    key: 'D Minor',
    genre: 'Blue-Collar Devotional / Country-Rock',
    vocal: 'Brandon',
    versions: [
      { tag: 'v2.0bZ', styleName: 'CHH Gold Remaster', notes: '5:00 AM freezing rain, amber dashboard dials, vulnerable intimate vocal.' }
    ],
    stems: [
      { id: 1, name: 'Track 1: Meet Me Here CHH v2.0bZ Remastered', stemFilename: 'Meet-Me-Here-CHH-v2.0bZ-Remastered.mp3', stemType: 'master', color: '#6366f1', freq: 146.83, waveType: 'sawtooth' },
      { id: 2, name: 'Track 2: Meet Me Here CHH v2.0aZ Remastered', stemFilename: 'Meet-Me-Here-CHH-v2.0aZ-Remastered.mp3', stemType: 'guitar', color: '#10b981', freq: 293.66, waveType: 'triangle' },
      { id: 3, name: 'Track 3: Meet Me Here CHH v2.0bY Remastered', stemFilename: 'Meet-Me-Here-CHH-v2.0bY-Remastered.mp3', stemType: 'organ', color: '#f59e0b', freq: 220, waveType: 'sine' },
      { id: 4, name: 'Track 4: Dax Reference (Can You Hear Me)', stemFilename: 'Dax-God-Can-You-Hear-me.mp3', stemType: 'vocal', color: '#ec4899', freq: 73.42, waveType: 'square' }
    ],
    visualTitle: 'Dark Blue-Collar Truck Cab at 5 AM in Freezing Rain',
    sceneTitle: 'Steering Wheel Altar Before the Work Shift'
  },
  {
    trackId: 'TRK-17',
    title: 'In Our Veins',
    folderName: 'In-Our-Veins',
    aliases: ['TRK-17', 'In-Our-Veins', 'In_Our_Veins', 'In Our Veins', 'IOV', '00-Active_Projects/In-Our-Veins'],
    bpm: 78,
    key: 'D Minor',
    genre: 'Heavy Tribal Worship Ballad',
    vocal: 'Kane',
    versions: [
      { tag: 'v3.5', styleName: 'Brandon Josiah Gold Master (FLAC)', notes: 'Heartbeat sub kicks, massive choral swells, primal blood-covenant imagery.' }
    ],
    stems: [
      { id: 1, name: 'Track 1: In Our Veins v3.5 Gold Master (FLAC)', stemFilename: '6.5s-In-Our-Veins-v3.5-Brandon-Josiah-Remastered-_03-28-v3.5.flac', stemType: 'master', color: '#6366f1', freq: 146.83, waveType: 'sawtooth' },
      { id: 2, name: 'Track 2: Real Isolated Instrumental Bed (FLAC)', stemFilename: '1765687546_1_6.55s-In-Our-Veins-v3.1-Brandon-Josiah-Remastered-_-Instrumental-_03-38.flac', stemType: 'guitar', color: '#10b981', freq: 293.66, waveType: 'triangle' },
      { id: 3, name: 'Track 3: In Our Veins v3.7 Piano Power Ballad', stemFilename: '7s In our Veins 3.7 Piano Power Ballad.mp3', stemType: 'piano', color: '#f59e0b', freq: 220, waveType: 'sine' },
      { id: 4, name: 'Track 4: In Our Veins v3 Brandon Josiah Remaster', stemFilename: 'In-Our-Veins-v3-Brandon-Josiah-Remastered-_03-38-6s.mp3', stemType: 'drums', color: '#ec4899', freq: 73.42, waveType: 'square' }
    ],
    visualTitle: 'Red Crimson River Flowing Through Ancient Granite Canyon',
    sceneTitle: 'Bloodline Redeemed in the Holy Place'
  },
  {
    trackId: 'TRK-18',
    title: 'We Bow We Shout',
    folderName: 'We-Bow-We-Shout',
    aliases: ['TRK-18', 'We-Bow-We-Shout', 'We_Bow_We_Shout', 'We Bow We Shout', 'WBWS', '00-Active_Projects/We-Bow-We-Shout'],
    bpm: 84,
    key: 'A Minor',
    genre: 'Modern Tribal Worship Anthem',
    vocal: 'Worship Collective',
    versions: [
      { tag: 'v9.93', styleName: 'Modern Tribal Gold Master (FLAC)', notes: 'Tribal percussion, shofar blasts, corporate worship chant, roaring guitars.' }
    ],
    stems: [
      { id: 1, name: 'Track 1: We Bow We Shout v9.93 Gold Master (FLAC)', stemFilename: '1-v9.93-We-Bow-We-Shout-Remastered-FLAC00086400-2025-12-06-23_12_05-14.flac', stemType: 'master', color: '#6366f1', freq: 220, waveType: 'sawtooth' },
      { id: 2, name: 'Track 2: Real Isolated Instrumental Stem (FLAC)', stemFilename: '1765695254_1_1-v9.93-We-Bow-We-Shout-Remastered-FLAC00086400-2025-12-06-23_12_-Instrumental-_05-14.flac', stemType: 'guitar', color: '#10b981', freq: 440, waveType: 'square' },
      { id: 3, name: 'Track 3: Noise-Reduced Intimate Worship Master', stemFilename: 'We-Bow-We-Shout-v9.93reduction-noise-Intimate-Worship-by-Ted-Moyer-Remastered-_05-15-7sr.flac', stemType: 'organ', color: '#f59e0b', freq: 330, waveType: 'sine' },
      { id: 4, name: 'Track 4: Banjo Rock Hick-Hop Remaster', stemFilename: 'We-Bow-We-Shout-v2ba-Banjo-Rock-Hick-Hop-Remastered.mp3', stemType: 'drums', color: '#ec4899', freq: 110, waveType: 'triangle' }
    ],
    visualTitle: 'Multitude with Raised Hands on Flagstone Courtyard',
    sceneTitle: 'Falling Low to Lift High'
  },
  {
    trackId: 'TRK-19',
    title: 'Through The Valley Or The Flame',
    folderName: 'Through-the-Valley-Or-the-Flame',
    aliases: ['TRK-19', 'Through-the-Valley-Or-the-Flame', 'Through_The_Valley_Or_The_Flame', 'Through The Valley Or The Flame', 'TVTF', '00-Active_Projects/Through-the-Valley-Or-the-Flame'],
    bpm: 90,
    key: 'E Minor',
    genre: 'Genre-Bending Battleground Roots',
    vocal: 'Brandon & Silas Thorne',
    versions: [
      { tag: 'v2.0', styleName: 'Country Battleground Master', notes: 'Screaming harmonica, slide dobro, swamp stomp, fiery vocal duel.' }
    ],
    stems: [
      { id: 1, name: 'Track 1: Through the Valley Country Master', stemFilename: 'Remastered-412568Db-E312-402A-92Ff-9D416B1Df3A7-Christian-Country-7s-Through-the-Valley-Or-The-Flame.mp3', stemType: 'master', color: '#6366f1', freq: 164.81, waveType: 'sawtooth' },
      { id: 2, name: 'Track 2: Resonator & Slide Dobro Bed', stemFilename: 'Remastered-412568Db-E312-402A-92Ff-9D416B1Df3A7-Christian-Country-7s-Through-the-Valley-Or-The-Flame.mp3', stemType: 'guitar', color: '#10b981', freq: 329.63, waveType: 'triangle' },
      { id: 3, name: 'Track 3: Overdriven Swamp Bassline', stemFilename: 'Remastered-412568Db-E312-402A-92Ff-9D416B1Df3A7-Christian-Country-7s-Through-the-Valley-Or-The-Flame.mp3', stemType: 'bass', color: '#f59e0b', freq: 82.41, waveType: 'sine' },
      { id: 4, name: 'Track 4: Heavy Mud-Stomp Drums', stemFilename: 'Remastered-412568Db-E312-402A-92Ff-9D416B1Df3A7-Christian-Country-7s-Through-the-Valley-Or-The-Flame.mp3', stemType: 'drums', color: '#ec4899', freq: 82.41, waveType: 'square' }
    ],
    visualTitle: 'Fourth Man in the Fiery Furnace Unbound and Glowing',
    sceneTitle: 'Walking Through the Furnace Unharmed'
  },
  {
    trackId: 'TRK-20',
    title: 'Ghost In The Machine',
    folderName: 'Ghost-In-The-Machine',
    aliases: ['TRK-20', 'Ghost-In-The-Machine', 'Ghost_In_The_Machine', 'Ghost In The Machine', 'GITM', '00-Active_Projects/Ghost-In-The-Machine'],
    bpm: 130,
    key: 'Eb Minor',
    genre: 'Industrial CHH / K-Pop Fusion Dual-Cut',
    vocal: 'The Architect & Kane',
    versions: [
      { tag: 'v2.5bv2', styleName: 'Industrial CHH Cyber-Master (WAV)', notes: 'Dark electro-industrial basslines, heavy mechanical beats, razor lyric delivery.' }
    ],
    stems: [
      { id: 1, name: 'Track 1: Ghost In The Machine v2.5bv2 Master (WAV)', stemFilename: 'Ghost-In-The-Machine-CHH-v2.5bv2-Remastered.wav', stemType: 'master', color: '#6366f1', freq: 155.56, waveType: 'sawtooth' },
      { id: 2, name: 'Track 2: Ghost In The Machine v2.5bv1 Master (WAV)', stemFilename: 'Ghost-In-The-Machine-CHH-v2.5bv1-Remastered.wav', stemType: 'bass', color: '#10b981', freq: 77.78, waveType: 'square' },
      { id: 3, name: 'Track 3: Ghost In The Machine Radio Master (MP3)', stemFilename: 'Ghost In The Machine CHH v2.5bv2 (Remastered).mp3', stemType: 'organ', color: '#f59e0b', freq: 311.13, waveType: 'triangle' },
      { id: 4, name: 'Track 4: Industrial Beats & Cyber Saws', stemFilename: 'Ghost-In-The-Machine-CHH-v2.5bv2-Remastered.wav', stemType: 'drums', color: '#ec4899', freq: 77.78, waveType: 'square' }
    ],
    visualTitle: 'Digital Circuit Board Dissolving into Living Cedar Bark',
    sceneTitle: 'Unmasking the Hologram of Deception'
  },
  {
    trackId: 'TRK-21',
    title: 'The Milestone (Confident & Consistent)',
    folderName: 'Milestone',
    aliases: ['TRK-21', 'Milestone', 'The_Milestone', 'The-Milestone', 'The Milestone', 'TMS', 'Resurrection_Dawn', '00-Active_Projects/Milestone'],
    bpm: 128,
    key: 'G Minor',
    genre: 'Driving Praise Pop / Resurrection Anthem',
    vocal: 'Mrs T / Full Choir',
    versions: [
      { tag: 'v1.0', styleName: 'The Milestone Universal Master (WAV)', notes: 'Full Ms T choir crescendo, triumphant brass, soaring synthesizer hooks.' }
    ],
    stems: [
      { id: 1, name: 'Track 1: The Milestone Uni50 Mastered (WAV)', stemFilename: 'The Milestone-Uni50-Mastered.wav', stemType: 'master', color: '#6366f1', freq: 196, waveType: 'sawtooth' },
      { id: 2, name: 'Track 2: Ted Moyer - The Milestone (M4A)', stemFilename: 'Ted Moyer - The Milestone.m4a', stemType: 'vocal', color: '#10b981', freq: 293.66, waveType: 'triangle' },
      { id: 3, name: 'Track 3: Milestone Instrumental Core (WAV)', stemFilename: 'The Milestone-Uni50-Mastered.wav', stemType: 'organ', color: '#f59e0b', freq: 392, waveType: 'sawtooth' },
      { id: 4, name: 'Track 4: Four-on-the-Floor Rhythm (WAV)', stemFilename: 'The Milestone-Uni50-Mastered.wav', stemType: 'drums', color: '#ec4899', freq: 98, waveType: 'square' }
    ],
    visualTitle: 'Sunburst Breaking Through Ancient Limestone Archway',
    sceneTitle: 'Resurrection Dawn Flagstone Celebration'
  },
  {
    trackId: 'TRK-22',
    title: 'Breath and Bone',
    folderName: 'Breath-and-Bone',
    aliases: ['TRK-22', 'Breath-and-Bone', 'Breath_and_Bone', 'Breath and Bone', 'BAB', '00-Active_Projects/Breath-and-Bone'],
    bpm: 76,
    key: 'D Major',
    genre: 'Cinematic Worship / Resurrected Life',
    vocal: 'Brandon & Ms T',
    versions: [
      { tag: 'v3.6r', styleName: 'Breath & Bone Male Remastered (FLAC)', notes: 'Ezekiel 37 vision, wind foley, swelling cellos, explosive resurrection chorus.' }
    ],
    stems: [
      { id: 1, name: 'Track 1: Breath & Bone v3.6r Master (FLAC)', stemFilename: 'v3.6r-Breath-&-Bone-Male-Remastered.flac', stemType: 'master', color: '#6366f1', freq: 146.83, waveType: 'sawtooth' },
      { id: 2, name: 'Track 2: Breath & Bone v3.6r Remastered (MP3)', stemFilename: 'v3.6r-Breath-&-Bone-Male-Remastered.mp3', stemType: 'organ', color: '#10b981', freq: 293.66, waveType: 'sine' },
      { id: 3, name: 'Track 3: Breath and Bone Gospel Anthem Remix v11.5', stemFilename: 'V11.5-Breath-and-Bone-Gospel-Anthem-Remix.mp3', stemType: 'guitar', color: '#f59e0b', freq: 220, waveType: 'triangle' },
      { id: 4, name: 'Track 4: Breath & Bone Intimate Acoustic v3.6', stemFilename: 'V3.6-Breath-&-Bone-Remastered-_04-52-6s.mp3', stemType: 'drums', color: '#ec4899', freq: 73.42, waveType: 'square' }
    ],
    visualTitle: 'Dry Bones Clothed in Tendons and Golden Sunlight',
    sceneTitle: 'Breathe on the Slayed that They May Live'
  },
  {
    trackId: 'TRK-23',
    title: 'Blindfold Blessing',
    folderName: 'Blindfold-Blessing',
    aliases: ['TRK-23', 'Blindfold-Blessing', 'Blindfold_Blessing', 'Blindfold Blessing', 'BFB', '00-Active_Projects/Blindfold-Blessing'],
    bpm: 128,
    key: 'A Major',
    genre: 'Country Duet / Progressive CEDM Dual-Cut',
    vocal: 'Monica & Silas Thorne',
    versions: [
      { tag: 'v2.0', styleName: 'CEDM Punch Master', notes: 'Banjo and fiddle meets 128 BPM supersaws, dance drop, triumphant vocal hook.' }
    ],
    stems: [
      { id: 1, name: 'Track 1: Blindfold Blessing CEDM Punch Master', stemFilename: 'Blindfold_Blessing_CEDM-PUNCH.mp3', stemType: 'master', color: '#6366f1', freq: 220, waveType: 'sawtooth' },
      { id: 2, name: 'Track 2: Progressive CEDM Drop Accent', stemFilename: 'Blindfold_Blessing_CEDM-PUNCH.mp3', stemType: 'guitar', color: '#10b981', freq: 440, waveType: 'triangle' },
      { id: 3, name: 'Track 3: Lead Synth & Duet Vocal', stemFilename: 'Blindfold_Blessing_CEDM-PUNCH.mp3', stemType: 'organ', color: '#f59e0b', freq: 330, waveType: 'sine' },
      { id: 4, name: 'Track 4: High-Energy Dance Floor Groove', stemFilename: 'Blindfold_Blessing_CEDM-PUNCH.mp3', stemType: 'drums', color: '#ec4899', freq: 110, waveType: 'square' }
    ],
    visualTitle: 'Silk Blindfold Falling Away Revealing Golden Horizon',
    sceneTitle: 'Trusting What the Eye Cannot See'
  },
  {
    trackId: 'TRK-24',
    title: 'Trading In The Mask',
    folderName: 'Trading-In-The-Mask',
    aliases: ['TRK-24', 'Trading-In-The-Mask', 'Trading_In_The_Mask', 'Trading In The Mask', 'TIM', '00-Active_Projects/Trading-In-The-Mask'],
    bpm: 82,
    key: 'Eb Major',
    genre: 'A Cappella Spoken Word to Explosive Gospel',
    vocal: 'Silas Thorne',
    versions: [
      { tag: 'v5.5b2', styleName: '24-Bit Studio Master (WAV)', notes: 'Quiet confession turning into massive gospel choir and screaming Hammond B3.' }
    ],
    stems: [
      { id: 1, name: 'Track 1: Trading In The Mask v5.5b2 Master (WAV)', stemFilename: 'Trading-In-The-Mask-v5.5b2-Remastered.wav', stemType: 'master', color: '#6366f1', freq: 155.56, waveType: 'sawtooth' },
      { id: 2, name: 'Track 2: Trading In The Mask v5.5b1 Master (WAV)', stemFilename: 'Trading-In-The-Mask-v5.5b1-Remastered.wav', stemType: 'choir', color: '#10b981', freq: 311.13, waveType: 'triangle' },
      { id: 3, name: 'Track 3: Trading In The Mask v5.5b Mix (MP3)', stemFilename: 'Trading-In-The-Mask-v5.5b.mp3', stemType: 'organ', color: '#f59e0b', freq: 233.08, waveType: 'sine' },
      { id: 4, name: 'Track 4: Trading In The Mask v5.5a Mix (MP3)', stemFilename: 'Trading-In-The-Mask-v5.5a.mp3', stemType: 'drums', color: '#ec4899', freq: 77.78, waveType: 'square' }
    ],
    visualTitle: 'Ceramic Mask Shattering on Cold Flagstone Altar',
    sceneTitle: 'Unveiled Faces Before the Lord'
  },
  {
    trackId: 'TRK-25',
    title: 'Never-ending What’s Next',
    folderName: 'Neverending-Whats-Next',
    aliases: ['TRK-25', 'Neverending-Whats-Next', 'Never_ending_Whats_Next', 'Never-ending What’s Next', 'NEWN', '00-Active_Projects/Neverending-Whats-Next'],
    bpm: 70,
    key: 'F Major',
    genre: 'Spoken Word / Deep Soulful Alto Anthem',
    vocal: 'Ms T',
    versions: [
      { tag: 'v1.0ab', styleName: 'Spoken Intro Edit Master (FLAC)', notes: 'Warm Wurlitzer electric piano, upright bass, tender brushed drums, soulful sanctuary reflection.' }
    ],
    stems: [
      { id: 1, name: 'Track 1: NWN v1.0ab Spoken Intro Master (FLAC)', stemFilename: 'NWN-v1.0ab-Spoken-Intro-Edit-Remastered.flac', stemType: 'master', color: '#6366f1', freq: 174.61, waveType: 'sawtooth' },
      { id: 2, name: 'Track 2: NWN v1.0aa Spoken Intro Master (WAV)', stemFilename: 'NWN-v1.0aa Spoken Intro (Edit) (Remastered).wav', stemType: 'piano', color: '#10b981', freq: 349.23, waveType: 'sine' },
      { id: 3, name: 'Track 3: Ted Moyer - Neverending Whats Next BMV3', stemFilename: 'Ted Moyer - Neverending Whats Next BMV3.m4a', stemType: 'bass', color: '#f59e0b', freq: 87.31, waveType: 'triangle' },
      { id: 4, name: 'Track 4: NWN v1.0ab Alternate Take (WAV)', stemFilename: 'NWN-v1.0ab Spoken Intro (Edit) (Remastered).wav', stemType: 'drums', color: '#ec4899', freq: 87.31, waveType: 'square' }
    ],
    visualTitle: 'Open Door into Endless Green Pastures at Dawn',
    sceneTitle: 'Resting in the Sufficiency of Christ'
  },
  {
    trackId: 'TRK-26',
    title: 'Meet Me Here (Harder Scream)',
    folderName: 'Meet_Me_Here',
    aliases: ['TRK-26', 'Meet-Me-Here-Scream', 'MMH_Harder_Scream', 'Meet Me Here (Harder Scream)', 'MMH-Scream', '00-Active_Projects/Meet-Me-Here-Scream'],
    bpm: 76,
    key: 'D Minor',
    genre: 'Heavy Screamo / Post-Hardcore Devotional',
    vocal: 'Brandon (Raw Scream & Growl)',
    versions: [
      { tag: 'v2.0bZ', styleName: 'Full Post-Hardcore Cut', notes: 'Wall of distorted guitars, double-bass drum breakdown, visceral screams.' }
    ],
    stems: [
      { id: 1, name: 'Track 1: Meet Me Here CHH v2.0bZ Master (MP3)', stemFilename: 'Meet-Me-Here-CHH-v2.0bZ-Remastered.mp3', stemType: 'master', color: '#6366f1', freq: 146.83, waveType: 'sawtooth' },
      { id: 2, name: 'Track 2: Meet Me Here CHH v2.0aZ Alternate (MP3)', stemFilename: 'Meet-Me-Here-CHH-v2.0aZ-Remastered.mp3', stemType: 'guitar', color: '#10b981', freq: 293.66, waveType: 'square' },
      { id: 3, name: 'Track 3: Meet Me Here CHH v2.0bY Remaster (MP3)', stemFilename: 'Meet-Me-Here-CHH-v2.0bY-Remastered.mp3', stemType: 'bass', color: '#f59e0b', freq: 73.42, waveType: 'sawtooth' },
      { id: 4, name: 'Track 4: Dax Reference (Can You Hear Me)', stemFilename: 'Dax-God-Can-You-Hear-me.mp3', stemType: 'drums', color: '#ec4899', freq: 73.42, waveType: 'square' }
    ],
    visualTitle: 'Screaming Steel Foundry and Smoldering Sparks',
    sceneTitle: 'Gethsemane Agony Under Heavy Rain'
  }
];

// Fallback generic definition builder for any remaining tracks in the 27-song catalog
export function getOrCreateTrackDefinition(track: Track): TrackNextcloudDefinition {
  const found = CATALOG_TRACK_DEFINITIONS.find(d => d.trackId === track.id);
  if (found) return found;

  const sanitized = track.title.replace(/[^a-zA-Z0-9]/g, '_');
  const acronym = track.title.split(' ').map(w => w[0]).join('').toUpperCase();

  return {
    trackId: track.id,
    title: track.title,
    folderName: track.id,
    aliases: [track.id, sanitized, track.title, acronym],
    bpm: track.bpm || 80,
    key: track.key || 'C Major',
    genre: track.genre || 'Contemporary Christian',
    vocal: track.vocal || 'Lead Vocal',
    versions: (track.versions && track.versions.length > 0)
      ? track.versions.map((v, i) => ({ tag: v.version || `v${i + 1}.0`, styleName: v.version || `Style ${i + 1}`, notes: v.reason || 'Studio Master' }))
      : [{ tag: 'v1.0', styleName: 'Studio Master', notes: '24-Bit / 48kHz Master Print' }],
    stems: [
      { id: 1, name: `Track 1: Lead Vocal (${track.vocal || 'Lead'}) [UVR5 Clean]`, stemFilename: `${track.id}_Lead_Vocal_Clean_BS-Roformer.wav`, stemType: 'vocal', color: '#6366f1', freq: 196, waveType: 'sawtooth' },
      { id: 2, name: `Track 2: Harmonies & Background Choir`, stemFilename: `${track.id}_Harmonies_Choir_UVR5.wav`, stemType: 'choir', color: '#10b981', freq: 246.94, waveType: 'triangle' },
      { id: 3, name: `Track 3: Core Instrumental Bed (${track.genre})`, stemFilename: `${track.id}_Core_Instrumental_Bed.wav`, stemType: 'guitar', color: '#f59e0b', freq: 293.66, waveType: 'sine' },
      { id: 4, name: `Track 4: Drums, Bass & Rhythm Section`, stemFilename: `${track.id}_Rhythm_Section_Drums_Bass.wav`, stemType: 'drums', color: '#ec4899', freq: 98, waveType: 'square' }
    ],
    visualTitle: `${track.title} 4K Sovereign Cathedral Master`,
    sceneTitle: `${track.title} Storyboard Devotional Scene`
  };
}

/**
 * Generate full AOT Nextcloud folder asset manifest for a given track definition.
 */
export function generateTrackNextcloudAssets(def: TrackNextcloudDefinition): NextcloudFolderAsset[] {
  const folderPath = `/remote.php/dav/files/ncted/Music-Production/${def.folderName}`;
  const shareUrl = `https://nextcloud.moyercloud.com/index.php/apps/files/files/207332?dir=/Music-Production/${def.folderName}`;
  const assets: NextcloudFolderAsset[] = [];

  // 1. Masters for all versions/styles
  def.versions.forEach((ver, idx) => {
    const masterStem = def.stems.find(s => s.stemType === 'master') || def.stems[idx % def.stems.length] || def.stems[0];
    const realAudioFilename = masterStem ? masterStem.stemFilename : `${def.folderName}_Master_${ver.tag}.wav`;
    const webdavPath = realAudioFilename.startsWith('/') ? realAudioFilename : `${folderPath}/${realAudioFilename}`;
    const audioUrl = buildNextcloudStreamUrl(webdavPath);
    assets.push({
      id: `NC-${def.trackId}-M${idx + 1}`,
      name: `${def.title} - ${ver.tag} (${ver.styleName})`,
      filename: realAudioFilename,
      folderId: def.folderName,
      category: 'MASTER_AUDIO',
      fileSizeBytes: 52428800 + idx * 2000000,
      fileSizeFormatted: `${(50 + idx * 2.5).toFixed(1)} MB`,
      mimeType: realAudioFilename.endsWith('.flac') ? 'audio/flac' : realAudioFilename.endsWith('.mp3') ? 'audio/mpeg' : 'audio/wav',
      webdavPath,
      audioUrl,
      shareUrl,
      matchedTrackId: def.trackId,
      matchedTrackTitle: def.title,
      matchConfidence: 100,
      suggestedTrackId: def.trackId,
      suggestedCategory: 'MASTER_AUDIO',
      isMatched: true,
      bpm: def.bpm,
      key: def.key,
      audioDurationSeconds: 220,
      stemType: 'master',
      previewAudioType: 'instrumental',
      freq: def.stems[0]?.freq || 196,
      waveType: 'sawtooth',
      notes: `${ver.tag} (${ver.styleName}): ${ver.notes} Master Audio. Nashville LUFS -14.1 compliant.`,
      lastSyncedAt: new Date().toISOString(),
      tags: [def.folderName, def.title, def.trackId, ver.tag, 'Master Audio', 'Fiber Synced']
    });
  });

  // 2. Stems
  def.stems.forEach((stem) => {
    const webdavPath = stem.stemFilename.startsWith('/') ? stem.stemFilename : `${folderPath}/${stem.stemFilename}`;
    const audioUrl = buildNextcloudStreamUrl(webdavPath);
    const category: NextcloudAssetCategory =
      stem.stemType === 'drums'
        ? 'UVR5_DRUMS_STEM'
        : stem.stemType === 'bass'
        ? 'UVR5_BASS_STEM'
        : stem.stemType === 'vocal'
        ? 'UVR5_VOCAL_STEM'
        : stem.stemType === 'choir'
        ? 'UVR5_HARMONY_STEM'
        : 'INSTRUMENTAL_STEM';

    assets.push({
      id: `NC-${def.trackId}-S${stem.id}`,
      name: stem.name,
      filename: stem.stemFilename,
      folderId: def.folderName,
      category,
      fileSizeBytes: 28000000 + stem.id * 1500000,
      fileSizeFormatted: `${(26.5 + stem.id * 1.5).toFixed(1)} MB`,
      mimeType: 'audio/wav',
      webdavPath,
      audioUrl,
      shareUrl,
      matchedTrackId: def.trackId,
      matchedTrackTitle: def.title,
      matchConfidence: 100,
      suggestedTrackId: def.trackId,
      suggestedCategory: category,
      isMatched: true,
      bpm: def.bpm,
      key: def.key,
      audioDurationSeconds: 220,
      stemType: stem.stemType,
      freq: stem.freq,
      waveType: stem.waveType,
      color: stem.color,
      previewAudioType: stem.stemType === 'drums' ? 'drums' : stem.stemType === 'vocal' ? 'vocal' : 'harmony',
      notes: `${stem.name}. High dynamic range, zero cross-bleed stem isolation.`,
      lastSyncedAt: new Date().toISOString(),
      tags: [def.folderName, def.trackId, 'Stem', stem.stemType, 'Nextcloud WebDAV']
    });
  });

  // 3. 4K Cover Art
  assets.push({
    id: `NC-${def.trackId}-ART`,
    filename: `${def.folderName}_Cover_Art_4k_1x1.png`,
    folderId: def.folderName,
    category: 'VISUAL_ARTWORK',
    fileSizeBytes: 8388608,
    fileSizeFormatted: '8.0 MB',
    mimeType: 'image/png',
    webdavPath: `${folderPath}/visuals/${def.folderName}_Cover_Art_4k_1x1.png`,
    shareUrl,
    matchedTrackId: def.trackId,
    matchedTrackTitle: def.title,
    matchConfidence: 100,
    suggestedTrackId: def.trackId,
    suggestedCategory: 'VISUAL_ARTWORK',
    isMatched: true,
    previewImageUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800"><defs><linearGradient id="g_${def.trackId}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%230f172a"/><stop offset="50%" stop-color="%231e1b4b"/><stop offset="100%" stop-color="%23020617"/></linearGradient></defs><rect width="800" height="800" fill="url(%23g_${def.trackId})"/><circle cx="400" cy="360" r="260" fill="%236366f1" opacity="0.15"/><circle cx="400" cy="360" r="160" fill="%23f59e0b" opacity="0.25"/><text x="400" y="380" font-family="system-ui, sans-serif" font-size="72" font-weight="900" fill="%23ffffff" text-anchor="middle">${def.trackId}</text><text x="400" y="660" font-family="system-ui, sans-serif" font-size="28" font-weight="900" fill="%23fef08a" text-anchor="middle" letter-spacing="2">${def.title.toUpperCase()}</text><text x="400" y="705" font-family="monospace" font-size="14" font-weight="700" fill="%2338bdf8" text-anchor="middle" letter-spacing="3">${def.bpm} BPM • ${def.key} • NEXTCLOUD FIBER</text></svg>`,
    notes: `3840x3840 4K Album Art for ${def.title}. ${def.visualTitle}.`,
    lastSyncedAt: new Date().toISOString(),
    tags: [def.folderName, def.trackId, 'Cover Art', '4K', 'Artwork']
  });

  // 4. Storyboard Scene Plate
  assets.push({
    id: `NC-${def.trackId}-SCENE`,
    filename: `${def.folderName}_Storyboard_Scene_Plate_16x9.png`,
    folderId: def.folderName,
    category: 'VISUAL_ARTWORK',
    fileSizeBytes: 6291456,
    fileSizeFormatted: '6.0 MB',
    mimeType: 'image/png',
    webdavPath: `${folderPath}/visuals/${def.folderName}_Storyboard_Scene_Plate_16x9.png`,
    shareUrl,
    matchedTrackId: def.trackId,
    matchedTrackTitle: def.title,
    matchConfidence: 100,
    suggestedTrackId: def.trackId,
    suggestedCategory: 'VISUAL_ARTWORK',
    isMatched: true,
    previewImageUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720"><defs><linearGradient id="sc_${def.trackId}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="%231e1b4b"/><stop offset="50%" stop-color="%23312e81"/><stop offset="100%" stop-color="%230f172a"/></linearGradient></defs><rect width="1280" height="720" fill="url(%23sc_${def.trackId})"/><text x="640" y="320" font-family="system-ui, sans-serif" font-size="36" font-weight="900" fill="%23ffffff" text-anchor="middle">${def.title.toUpperCase()}</text><text x="640" y="380" font-family="system-ui, sans-serif" font-size="20" font-style="italic" fill="%23fde047" text-anchor="middle">&quot;${def.sceneTitle}&quot;</text><rect x="520" y="620" width="240" height="36" rx="18" fill="%236366f1"/><text x="640" y="643" font-family="monospace" font-size="13" font-weight="900" fill="%23ffffff" text-anchor="middle">STORYBOARD SCENE PLATE</text></svg>`,
    notes: `1920x1080 16:9 Storyboard Plate for ${def.title}. ${def.sceneTitle}.`,
    lastSyncedAt: new Date().toISOString(),
    tags: [def.folderName, def.trackId, 'Storyboard', '16:9', 'Video Express']
  });

  // 5. Video Reel
  assets.push({
    id: `NC-${def.trackId}-REEL`,
    filename: `${def.folderName}_Studio_Cinematic_Reel_1080p_9x16.mp4`,
    folderId: def.folderName,
    category: 'VIDEO_REEL',
    fileSizeBytes: 44040192,
    fileSizeFormatted: '42.0 MB',
    mimeType: 'video/mp4',
    webdavPath: `${folderPath}/video/${def.folderName}_Studio_Cinematic_Reel_1080p_9x16.mp4`,
    shareUrl,
    matchedTrackId: def.trackId,
    matchedTrackTitle: def.title,
    matchConfidence: 100,
    suggestedTrackId: def.trackId,
    suggestedCategory: 'VIDEO_REEL',
    isMatched: true,
    notes: `9:16 Vertical Video Reel for TikTok/Reels morning devotional release (6 AM - 9 AM rollout).`,
    lastSyncedAt: new Date().toISOString(),
    tags: [def.folderName, def.trackId, '9:16', 'TikTok', 'Reels', 'Video Reel']
  });

  // 6. 16:9 YouTube 4K Visualizer Loop
  assets.push({
    id: `NC-${def.trackId}-LOOP`,
    filename: `${def.folderName}_Visualizer_Loop_4k_16x9.mp4`,
    folderId: def.folderName,
    category: 'VIDEO_REEL',
    fileSizeBytes: 88080384,
    fileSizeFormatted: '84.0 MB',
    mimeType: 'video/mp4',
    webdavPath: `${folderPath}/video/${def.folderName}_Visualizer_Loop_4k_16x9.mp4`,
    shareUrl,
    matchedTrackId: def.trackId,
    matchedTrackTitle: def.title,
    matchConfidence: 100,
    suggestedTrackId: def.trackId,
    suggestedCategory: 'VIDEO_REEL',
    isMatched: true,
    notes: `16:9 4K YouTube Visualizer Loop with synced audio spectrum waves.`,
    lastSyncedAt: new Date().toISOString(),
    tags: [def.folderName, def.trackId, '16:9', 'YouTube', 'Visualizer Loop', '4K']
  });

  // 7. SOP & Lyric Documentation
  assets.push({
    id: `NC-${def.trackId}-DOC`,
    filename: `${def.folderName}_Lyrics_And_Theological_SOP.md`,
    folderId: def.folderName,
    category: 'LYRIC_SOP_DOC',
    fileSizeBytes: 16384,
    fileSizeFormatted: '16.0 KB',
    mimeType: 'text/markdown',
    webdavPath: `${folderPath}/docs/${def.folderName}_Lyrics_And_Theological_SOP.md`,
    shareUrl,
    matchedTrackId: def.trackId,
    matchedTrackTitle: def.title,
    matchConfidence: 100,
    suggestedTrackId: def.trackId,
    suggestedCategory: 'LYRIC_SOP_DOC',
    isMatched: true,
    notes: `Nashville SOP documentation, chord progressions, OBI funnel analysis, and theological guardrail audit.`,
    lastSyncedAt: new Date().toISOString(),
    tags: [def.folderName, def.trackId, 'SOP Doc', 'Chord Chart', 'Theology']
  });

  return assets;
}

// Canonical ECV assets exported for backwards compatibility
export const ECV_CANONICAL_ASSETS: NextcloudFolderAsset[] = generateTrackNextcloudAssets(CATALOG_TRACK_DEFINITIONS.find(d => d.trackId === 'TRK-03')!);

// All 27 canonical tracks & iterations in /Music-Production/ Nextcloud folder
export const ALL_CANONICAL_NEXTCLOUD_ASSETS: NextcloudFolderAsset[] = CATALOG_TRACK_DEFINITIONS.flatMap(def => generateTrackNextcloudAssets(def));

/**
 * Universal matcher that maps Nextcloud file names or aliases to track IDs across the entire catalog.
 */
export function matchNextcloudFilenameToTrack(filename: string): {
  trackId: string | null;
  trackTitle: string | null;
  confidence: number;
  category: NextcloudAssetCategory;
} {
  const lower = filename.toLowerCase();

  // Detect category from file extension and keywords
  let category: NextcloudAssetCategory = 'UNCATEGORIZED';
  if (lower.endsWith('.wav') || lower.endsWith('.flac') || lower.endsWith('.mp3')) {
    if (lower.includes('master')) category = 'MASTER_AUDIO';
    else if (lower.includes('vocal') || lower.includes('lead') || lower.includes('roformer') || lower.includes('choir')) category = 'UVR5_VOCAL_STEM';
    else category = 'INSTRUMENTAL_STEM';
  } else if (lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.webp')) {
    category = 'VISUAL_ARTWORK';
  } else if (lower.endsWith('.mp4') || lower.endsWith('.mov') || lower.endsWith('.webm')) {
    category = 'VIDEO_REEL';
  } else if (lower.endsWith('.md') || lower.endsWith('.txt') || lower.endsWith('.pdf')) {
    category = 'LYRIC_SOP_DOC';
  }

  // Check all catalog track definitions first
  for (const def of CATALOG_TRACK_DEFINITIONS) {
    const matches = def.aliases.some(alias => lower.includes(alias.toLowerCase()));
    if (matches) {
      return {
        trackId: def.trackId,
        trackTitle: def.title,
        confidence: 100,
        category
      };
    }
  }

  // Regex check for TRK-XX pattern
  const trkMatch = lower.match(/trk[-_]?([0-9]{2})/);
  if (trkMatch) {
    const trkId = `TRK-${trkMatch[1]}`;
    const def = CATALOG_TRACK_DEFINITIONS.find(d => d.trackId === trkId);
    return {
      trackId: trkId,
      trackTitle: def ? def.title : trkId,
      confidence: 95,
      category
    };
  }

  return {
    trackId: null,
    trackTitle: null,
    confidence: 0,
    category
  };
}

/**
 * Get all assets for ANY given track, checking the AOT pre-indexed catalog,
 * localStorage live cache, and alias matching across all 27 tracks.
 */
export function getTrackNextcloudAssets(trackId: string, trackTitle?: string): NextcloudFolderAsset[] {
  // Find definition or build dynamic one
  const def = CATALOG_TRACK_DEFINITIONS.find(d => d.trackId === trackId) ||
    CATALOG_TRACK_DEFINITIONS.find(d => trackTitle && d.aliases.some(a => trackTitle.toLowerCase().includes(a.toLowerCase()))) ||
    getOrCreateTrackDefinition({ id: trackId, title: trackTitle || trackId } as Track);

  const canonicalAssets = generateTrackNextcloudAssets(def);

  // Check if there are live synced assets saved in localStorage for this track
  if (typeof window !== 'undefined') {
    try {
      const live = localStorage.getItem(`brickos_nextcloud_live_assets_${trackId}`) ||
        (def.folderName !== trackId ? localStorage.getItem(`brickos_nextcloud_live_assets_${def.folderName}`) : null);

      if (live) {
        const parsed = JSON.parse(live);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const combinedMap = new Map<string, NextcloudFolderAsset>();
          canonicalAssets.forEach(a => combinedMap.set(a.filename, a));
          parsed.forEach((a: NextcloudFolderAsset) => combinedMap.set(a.filename, a));
          return Array.from(combinedMap.values());
        }
      }
    } catch (_) {}
  }

  return canonicalAssets;
}

/**
 * Universally generate tailored 4-stem channel strips for ANY track in the catalog
 * based on its real stems, WebDAV paths, BPM, Key, and Genre.
 */
export function getTrackStems(track: Track): MixerTrack[] {
  const def = CATALOG_TRACK_DEFINITIONS.find(d => d.trackId === track.id) ||
    CATALOG_TRACK_DEFINITIONS.find(d => track.title && d.aliases.some(a => track.title.toLowerCase().includes(a.toLowerCase()))) ||
    getOrCreateTrackDefinition(track);

  const folderPath = `/remote.php/dav/files/ncted/Music-Production/${def.folderName}`;

  return def.stems.map((s, index) => {
    const webdavPath = s.stemFilename.startsWith('/') ? s.stemFilename : `${folderPath}/${s.stemFilename}`;
    const audioUrl = buildNextcloudStreamUrl(webdavPath);

    return {
      id: s.id,
      name: s.name,
      vol: index === 0 ? 92 : index === 1 ? 88 : index === 2 ? 85 : 80,
      pan: index === 1 ? -15 : index === 2 ? 15 : 0,
      muted: false,
      solo: false,
      trimIn: 0,
      trimOut: 100,
      freq: s.freq,
      waveType: s.waveType,
      color: s.color,
      audioUrl,
      webdavPath,
      stemType: s.stemType,
      isRealAudio: true,
      assetId: `NC-${def.trackId}-S${s.id}`
    };
  });
}
