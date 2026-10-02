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
      { tag: 'v3.0', styleName: 'Master Boom-Bap Cut', notes: 'Gritty MPC swing, warm upright bass, authentic male rap vocal.' },
      { tag: 'v1.0', styleName: 'Initial Acoustic Blueprint', notes: 'Raw spoken word sketch with vinyl crackle.' }
    ],
    stems: [
      { id: 1, name: 'Track 1: Lead Vocal (The Architect) [Clean BS-Roformer]', stemFilename: 'TRK-01_Lead_Vocal_UVR5_Clean_BS-Roformer.wav', stemType: 'vocal', color: '#6366f1', freq: 146.83, waveType: 'sawtooth' },
      { id: 2, name: 'Track 2: MPC Boom-Bap Drums & Percussion', stemFilename: 'TRK-01_Drums_MPC_BoomBap_88BPM.wav', stemType: 'drums', color: '#10b981', freq: 220, waveType: 'square' },
      { id: 3, name: 'Track 3: Upright Acoustic Bass & Rhodes Chords', stemFilename: 'TRK-01_Upright_Bass_Rhodes_Chords.wav', stemType: 'piano', color: '#f59e0b', freq: 110, waveType: 'triangle' },
      { id: 4, name: 'Track 4: Vinyl Crackle & Ambient Foley', stemFilename: 'TRK-01_Vinyl_Crackle_Ambient_Bed.wav', stemType: 'organ', color: '#ec4899', freq: 293.66, waveType: 'sine' }
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
      { tag: 'v2.0', styleName: 'Heavy Melodic Drop Master', notes: 'Massive supersaws, filtered drops, wood lathe foley, raw spoken word intro.' },
      { tag: 'v1.0', styleName: 'Acoustic Woodshop Narrative', notes: 'Weathered cedar acoustic fingerpicking.' }
    ],
    stems: [
      { id: 1, name: 'Track 1: Raspy Lead Spoken Word (Brandon)', stemFilename: 'TRK-02_Lead_Vocal_Raspy_Storyteller.wav', stemType: 'vocal', color: '#6366f1', freq: 185, waveType: 'sawtooth' },
      { id: 2, name: 'Track 2: Melodic Supersaws & Synth Swells', stemFilename: 'TRK-02_Melodic_Supersaw_Stabs.wav', stemType: 'organ', color: '#10b981', freq: 370, waveType: 'triangle' },
      { id: 3, name: 'Track 3: Wood Lathe Foley & Acoustic Martin Guitar', stemFilename: 'TRK-02_Wood_Lathe_Foley_Acoustic.wav', stemType: 'guitar', color: '#f59e0b', freq: 277.18, waveType: 'sine' },
      { id: 4, name: 'Track 4: 140 BPM Dubstep Snare & Sub Kick', stemFilename: 'TRK-02_Heavy_Dubstep_Rhythm_Section.wav', stemType: 'drums', color: '#ec4899', freq: 92.5, waveType: 'square' }
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
      { tag: 'v2.0', styleName: 'Gospel Group Shout', notes: 'Warm Hammond organ swell, gentle gospel piano chords, vocal ad-libs, explosive full choir finale.' },
      { tag: 'v1.0', styleName: 'Solo Tribute Acoustic', notes: 'Original intimate solo vocal and piano tribute to cancer survival.' }
    ],
    stems: [
      { id: 1, name: 'Track 1: Lead Vocal (Mrs T & Brandon) [Clean BS-Roformer]', stemFilename: 'ECV_Lead_Vocal_MrsT_Clean_BS-Roformer.wav', stemType: 'vocal', color: '#6366f1', freq: 196, waveType: 'sawtooth' },
      { id: 2, name: 'Track 2: Gospel Choir & Worship Harmonies', stemFilename: 'ECV_Gospel_Choir_Harmonies_UVR5.wav', stemType: 'choir', color: '#10b981', freq: 246.94, waveType: 'triangle' },
      { id: 3, name: 'Track 3: Hammond B3 Organ (Leslie Rotary)', stemFilename: 'ECV_Hammond_B3_Organ_Worship_Bed_G_Major.wav', stemType: 'organ', color: '#f59e0b', freq: 293.66, waveType: 'sine' },
      { id: 4, name: 'Track 4: Grand Piano & Martin Guitar Bed', stemFilename: 'ECV_Acoustic_Piano_Martin_Guitar_Bed.wav', stemType: 'guitar', color: '#ec4899', freq: 392, waveType: 'sawtooth' }
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
      { tag: 'v2.0', styleName: 'High-Octane 808 Festival Cut', notes: 'Driving 808 bass, trap hi-hat rolls, distorted electric guitar riffs.' },
      { tag: 'v1.0', styleName: 'Deep Alto Hymnal Flow', notes: 'Intimate gospel roots with electronic undertones.' }
    ],
    stems: [
      { id: 1, name: 'Track 1: Deep Alto Lead (Mrs T) & 808 Rap (Kane)', stemFilename: 'TRK-04_Lead_Vocal_Duet_MrsT_Kane.wav', stemType: 'vocal', color: '#6366f1', freq: 164.81, waveType: 'sawtooth' },
      { id: 2, name: 'Track 2: Distorted Electric Guitar & Heavy Chords', stemFilename: 'TRK-04_Electric_Guitar_Overdrive_Bed.wav', stemType: 'guitar', color: '#10b981', freq: 329.63, waveType: 'square' },
      { id: 3, name: 'Track 3: EDM Synth Arpeggios & Strings', stemFilename: 'TRK-04_EDM_Synth_Arp_Strings.wav', stemType: 'organ', color: '#f59e0b', freq: 246.94, waveType: 'sawtooth' },
      { id: 4, name: 'Track 4: 808 Sub Kick & Trap Hi-Hats', stemFilename: 'TRK-04_808_Sub_Trap_Drums.wav', stemType: 'drums', color: '#ec4899', freq: 82.41, waveType: 'triangle' }
    ],
    visualTitle: 'Ancient Weathered Cedar Cross at Dawn',
    sceneTitle: 'Scarlet River Over Dark Timber Valley'
  },
  {
    trackId: 'TRK-05',
    title: 'The Higher Measure',
    folderName: 'The-Higher-Measure',
    aliases: ['TRK-05', 'The-Higher-Measure', 'The_Higher_Measure', 'The Higher Measure', 'THM', '00-Active_Projects/The-Higher-Measure'],
    bpm: 104,
    key: 'D Major',
    genre: 'Anthemic Worship Pop',
    vocal: 'Brandon / Worship Collective',
    versions: [
      { tag: 'v2.0', styleName: 'Anthemic Stadium Cut', notes: 'Big acoustic drums, soaring lead vocal, shimmering acoustic rhythm.' },
      { tag: 'v1.0', styleName: 'Devotional Acoustic Sketch', notes: 'Simple Martin guitar and vocal.' }
    ],
    stems: [
      { id: 1, name: 'Track 1: Soaring Worship Lead (Brandon)', stemFilename: 'TRK-05_Lead_Vocal_Brandon.wav', stemType: 'vocal', color: '#6366f1', freq: 146.83, waveType: 'sawtooth' },
      { id: 2, name: 'Track 2: Acoustic Guitar & Shimmer Piano', stemFilename: 'TRK-05_Acoustic_Guitar_Piano_Bed.wav', stemType: 'guitar', color: '#10b981', freq: 293.66, waveType: 'triangle' },
      { id: 3, name: 'Track 3: Ambient Pad & Cello Swell', stemFilename: 'TRK-05_Ambient_Pad_Cello.wav', stemType: 'organ', color: '#f59e0b', freq: 220, waveType: 'sine' },
      { id: 4, name: 'Track 4: Stadium Kick & Snare Groove', stemFilename: 'TRK-05_Stadium_Drums_Rhythm.wav', stemType: 'drums', color: '#ec4899', freq: 73.42, waveType: 'square' }
    ],
    visualTitle: 'Golden Architect Measuring Line Over Foundations',
    sceneTitle: 'Ascending Mount Zion at First Light'
  },
  {
    trackId: 'TRK-06',
    title: 'Break the Bond / Correction is Restoration',
    folderName: 'Break-the-Bond',
    aliases: ['TRK-06', 'Break-the-Bond', 'Break_the_Bond', 'Correction-is-Restoration', 'Correction_is_Restoration', 'BTB', 'CIR', '00-Active_Projects/Break-the-Bond'],
    bpm: 92,
    key: 'C Minor',
    genre: 'Cinematic Urban Gospel',
    vocal: 'Mrs T',
    versions: [
      { tag: 'v2.0', styleName: 'Cinematic Gospel Orchestral', notes: 'Heavy orchestral strings, thunderous tympani, and prophetic alto vocals.' }
    ],
    stems: [
      { id: 1, name: 'Track 1: Prophetic Alto Lead (Mrs T)', stemFilename: 'TRK-06_Lead_Vocal_MrsT.wav', stemType: 'vocal', color: '#6366f1', freq: 130.81, waveType: 'sawtooth' },
      { id: 2, name: 'Track 2: Cinematic String Section & Brass', stemFilename: 'TRK-06_Strings_Brass_Orchestra.wav', stemType: 'organ', color: '#10b981', freq: 261.63, waveType: 'triangle' },
      { id: 3, name: 'Track 3: Grand Gospel Piano Bed', stemFilename: 'TRK-06_Gospel_Grand_Piano.wav', stemType: 'piano', color: '#f59e0b', freq: 196, waveType: 'sine' },
      { id: 4, name: 'Track 4: Heavy Hip Hop Rhythm & Timpani', stemFilename: 'TRK-06_Drums_Timpani_Section.wav', stemType: 'drums', color: '#ec4899', freq: 65.4, waveType: 'square' }
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
      { tag: 'v1.0', styleName: 'Fingerpicked Sanctuary Version', notes: 'Pure acoustic guitar, upright bass, and intimate devotional vocal.' }
    ],
    stems: [
      { id: 1, name: 'Track 1: Intimate Whispered Vocal (Brandon)', stemFilename: 'TRK-07_Lead_Vocal_Brandon.wav', stemType: 'vocal', color: '#6366f1', freq: 130.81, waveType: 'sine' },
      { id: 2, name: 'Track 2: Martin D-28 Fingerpicking Bed', stemFilename: 'TRK-07_Martin_D28_Acoustic.wav', stemType: 'guitar', color: '#10b981', freq: 261.63, waveType: 'triangle' },
      { id: 3, name: 'Track 3: Warm Reed Organ & Upright Bass', stemFilename: 'TRK-07_Reed_Organ_Upright_Bass.wav', stemType: 'organ', color: '#f59e0b', freq: 196, waveType: 'sawtooth' },
      { id: 4, name: 'Track 4: Subtle Room Foley & Soft Brushes', stemFilename: 'TRK-07_Room_Foley_Brushed_Snare.wav', stemType: 'drums', color: '#ec4899', freq: 65.4, waveType: 'square' }
    ],
    visualTitle: 'Open Bible on Weathered Oak Bench in Sunlight',
    sceneTitle: 'Morning Sanctuary Stillness'
  },
  {
    trackId: 'TRK-08',
    title: 'Check Your Heart Light',
    folderName: 'Check-Your-Heart-Light',
    aliases: ['TRK-08', 'Check-Your-Heart-Light', 'Check_Your_Heart_Light', 'Check Your Heart Light', 'CYHL', '00-Active_Projects/Check-Your-Heart-Light'],
    bpm: 104,
    key: 'G Major',
    genre: 'Neo-Soul Gospel Funk',
    vocal: 'Mrs T & The Saints',
    versions: [
      { tag: 'v2.0', styleName: 'Live Funk Band Cut', notes: 'Slap bass, tight horns, Rhodes keyboard, gospel call-and-response.' },
      { tag: 'v1.0', styleName: 'Swamptronica Revival Master', notes: 'Gritty bayou acoustic slide guitar with electronic groove.' }
    ],
    stems: [
      { id: 1, name: 'Track 1: Dynamic Soul Lead (Mrs T)', stemFilename: 'TRK-08_Lead_Vocal_MrsT.wav', stemType: 'vocal', color: '#6366f1', freq: 196, waveType: 'sawtooth' },
      { id: 2, name: 'Track 2: Funky Brass Section (Trumpet & Sax)', stemFilename: 'TRK-08_Brass_Horns_Section.wav', stemType: 'organ', color: '#10b981', freq: 392, waveType: 'triangle' },
      { id: 3, name: 'Track 3: Fender Rhodes & Wah Guitar Bed', stemFilename: 'TRK-08_Rhodes_Wah_Guitar.wav', stemType: 'guitar', color: '#f59e0b', freq: 293.66, waveType: 'sine' },
      { id: 4, name: 'Track 4: Slap Bass & Punchy Drum Groove', stemFilename: 'TRK-08_Slap_Bass_Funk_Drums.wav', stemType: 'drums', color: '#ec4899', freq: 98, waveType: 'square' }
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
      { tag: 'v2.0', styleName: 'High-Energy Radio Pop Master', notes: 'Shimmering guitars, sparkling brass hooks, anthemic dancefloor groove.' },
      { tag: 'v1.0', styleName: 'Romantic Soul Acoustic', notes: 'Intimate piano sketch and soft shaker rhythm.' }
    ],
    stems: [
      { id: 1, name: 'Track 1: Shimmer Pop Lead (The Pop Prodigy / Monica)', stemFilename: 'TRK-09_Lead_Vocal_Pop_Prodigy.wav', stemType: 'vocal', color: '#6366f1', freq: 220, waveType: 'sawtooth' },
      { id: 2, name: 'Track 2: Bright Synth Hooks & Sparkling Brass', stemFilename: 'TRK-09_Synth_Brass_Hooks.wav', stemType: 'organ', color: '#10b981', freq: 440, waveType: 'triangle' },
      { id: 3, name: 'Track 3: Electric Bass & Funk Rhythm Guitar', stemFilename: 'TRK-09_Funk_Rhythm_Guitar_Bass.wav', stemType: 'guitar', color: '#f59e0b', freq: 277.18, waveType: 'sine' },
      { id: 4, name: 'Track 4: Punchy 112 BPM Dance Drums & Claps', stemFilename: 'TRK-09_Punchy_Dance_Drums_112BPM.wav', stemType: 'drums', color: '#ec4899', freq: 110, waveType: 'square' }
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
      { tag: 'v2.0', styleName: 'Blue-Collar Heartland Rock Master', notes: 'Telecaster riffs, gritty male harmony, pounding kick drum, working-man anthemic chorus.' },
      { tag: 'v1.0', styleName: 'Acoustic Blueprint Sketch', notes: 'Solo acoustic guitar and gravel vocal.' }
    ],
    stems: [
      { id: 1, name: 'Track 1: Dual Lead Vocals (Brandon & The Architect)', stemFilename: 'TRK-10_Dual_Lead_Brandon_Architect.wav', stemType: 'vocal', color: '#6366f1', freq: 196, waveType: 'sawtooth' },
      { id: 2, name: 'Track 2: Telecaster Overdrive Riffs & Chords', stemFilename: 'TRK-10_Telecaster_Overdrive_Riffs.wav', stemType: 'guitar', color: '#10b981', freq: 392, waveType: 'square' },
      { id: 3, name: 'Track 3: Acoustic Rhythm & Hammond Organ Bed', stemFilename: 'TRK-10_Acoustic_Guitar_Hammond_Bed.wav', stemType: 'organ', color: '#f59e0b', freq: 293.66, waveType: 'sine' },
      { id: 4, name: 'Track 4: Driving Heartland Drum Kit & Bass', stemFilename: 'TRK-10_Heartland_Drums_Bass_92BPM.wav', stemType: 'drums', color: '#ec4899', freq: 98, waveType: 'triangle' }
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
      { tag: 'v2.0', styleName: 'Trap-Gospel Duet Master', notes: 'Aggressive 808 slides, blistering male/female back-and-forth cypher, choir hook.' },
      { tag: 'v1.0', styleName: 'Raw Cypher Sketch', notes: 'Beatbox and raw room vocal exchange.' }
    ],
    stems: [
      { id: 1, name: 'Track 1: High-Velocity Rap Duet (Kane & Monica)', stemFilename: 'TRK-11_Rap_Duet_Kane_Monica.wav', stemType: 'vocal', color: '#6366f1', freq: 138.59, waveType: 'sawtooth' },
      { id: 2, name: 'Track 2: Trap 808 Glides & Sub Bass', stemFilename: 'TRK-11_Sub_808_Glides.wav', stemType: 'bass', color: '#10b981', freq: 69.3, waveType: 'sine' },
      { id: 3, name: 'Track 3: Distorted Synth Horns & Gospel Choir', stemFilename: 'TRK-11_Synth_Horns_Choir_Hits.wav', stemType: 'choir', color: '#f59e0b', freq: 277.18, waveType: 'triangle' },
      { id: 4, name: 'Track 4: Crisp Trap Hi-Hat Rolls & Snare Stabs', stemFilename: 'TRK-11_Trap_HiHats_Snare_128BPM.wav', stemType: 'drums', color: '#ec4899', freq: 138.59, waveType: 'square' }
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
      { tag: 'v2.0', styleName: 'Cinematic Orchestral Worship Master', notes: 'Full orchestral strings, delicate grand piano intro rising into massive climactic vocal belt.' },
      { tag: 'v1.0', styleName: 'Intimate Grand Piano Solo', notes: 'Single microphone upright piano recording with vocal breath.' }
    ],
    stems: [
      { id: 1, name: 'Track 1: Emotive Resonant Lead (PATD)', stemFilename: 'TRK-12_Lead_Vocal_PATD.wav', stemType: 'vocal', color: '#6366f1', freq: 233.08, waveType: 'sawtooth' },
      { id: 2, name: 'Track 2: Sweeping Symphony Strings Section', stemFilename: 'TRK-12_Symphony_Strings_Section.wav', stemType: 'organ', color: '#10b981', freq: 466.16, waveType: 'sine' },
      { id: 3, name: 'Track 3: Concert Steinway Grand Piano Bed', stemFilename: 'TRK-12_Steinway_Grand_Piano_Bed.wav', stemType: 'piano', color: '#f59e0b', freq: 349.23, waveType: 'triangle' },
      { id: 4, name: 'Track 4: Orchestral Timpani & Ambient Swells', stemFilename: 'TRK-12_Orchestral_Timpani_Swells.wav', stemType: 'drums', color: '#ec4899', freq: 58.27, waveType: 'square' }
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
      { tag: 'v2.0', styleName: 'Heavy Southern Rock Master', notes: 'Grit electric slide guitar, stomping rhythm, southern vocal growl.' },
      { tag: 'v1.0', styleName: 'Stomp-Clap Acoustic Blueprint', notes: 'Resonator guitar, porch foot stomp, raw vocal.' }
    ],
    stems: [
      { id: 1, name: 'Track 1: Southern Rock Growl (Brandon)', stemFilename: 'TRK-13_Lead_Vocal_Grit.wav', stemType: 'vocal', color: '#6366f1', freq: 146.83, waveType: 'sawtooth' },
      { id: 2, name: 'Track 2: Resonator Slide Guitar & Banjo', stemFilename: 'TRK-13_Resonator_Slide_Guitar.wav', stemType: 'guitar', color: '#10b981', freq: 293.66, waveType: 'triangle' },
      { id: 3, name: 'Track 3: Overdriven Southern Hammond B3', stemFilename: 'TRK-13_Southern_B3_Organ.wav', stemType: 'organ', color: '#f59e0b', freq: 220, waveType: 'sine' },
      { id: 4, name: 'Track 4: Heavy Stomp-Clap Rhythm & Kick', stemFilename: 'TRK-13_Stomp_Clap_Heavy_Drums.wav', stemType: 'drums', color: '#ec4899', freq: 73.42, waveType: 'square' }
    ],
    visualTitle: 'Red Clay Quarry and Weathered Cedar Timbers',
    sceneTitle: 'Truck Bed Sunset Over Cross Ridgeline'
  },
  {
    trackId: 'TRK-14',
    title: 'Venom Into Victory',
    folderName: 'Venom-Into-Victory',
    aliases: ['TRK-14', 'Venom-Into-Victory', 'Venom_Into_Victory', 'Venom Into Victory', 'VIV', '00-Active_Projects/Venom-Into-Victory'],
    bpm: 132,
    key: 'F Minor',
    genre: 'K-Pop Fusion / Hyper-Pop CHH',
    vocal: 'The Pop Prodigy',
    versions: [
      { tag: 'v2.0', styleName: 'K-Pop Fusion Hyper-Pop Master', notes: 'Rapid-fire vocal runs, razor synths, high-intensity rhythm, explosive bass drop.' },
      { tag: 'v1.0', styleName: 'Cyber-Trap Blueprint', notes: 'Dark synthwave bassline and vocoded hook.' }
    ],
    stems: [
      { id: 1, name: 'Track 1: Hyper-Pop Vocals (The Pop Prodigy)', stemFilename: 'TRK-14_Lead_Vocal_Pop_Prodigy.wav', stemType: 'vocal', color: '#6366f1', freq: 174.61, waveType: 'sawtooth' },
      { id: 2, name: 'Track 2: Cyber Saws & Glitch FX Arpeggio', stemFilename: 'TRK-14_Cyber_Saws_Glitch_Arp.wav', stemType: 'organ', color: '#10b981', freq: 349.23, waveType: 'square' },
      { id: 3, name: 'Track 3: Deep Sub 808 Bass & Distorted Synth', stemFilename: 'TRK-14_Sub_808_Distorted_Bass.wav', stemType: 'bass', color: '#f59e0b', freq: 87.31, waveType: 'triangle' },
      { id: 4, name: 'Track 4: Syncopated K-Pop Drum Stems 132 BPM', stemFilename: 'TRK-14_KPop_Drums_Percussion_132BPM.wav', stemType: 'drums', color: '#ec4899', freq: 87.31, waveType: 'square' }
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
      { tag: 'v2.0', styleName: 'Cinematic Stadium Worship Master', notes: 'Thundering floor toms, soaring French horns, Ms T declaring divine sovereignty.' },
      { tag: 'v1.0', styleName: 'Solitary Cry Piano Cut', notes: 'Vocal weeping and acoustic piano resonance.' }
    ],
    stems: [
      { id: 1, name: 'Track 1: Triumphant Alto Lead (Ms T)', stemFilename: 'TRK-15_Lead_Vocal_MsT.wav', stemType: 'vocal', color: '#6366f1', freq: 155.56, waveType: 'sawtooth' },
      { id: 2, name: 'Track 2: Full Worship String Orchestra & Horns', stemFilename: 'TRK-15_Strings_Orchestra_Horns.wav', stemType: 'organ', color: '#10b981', freq: 311.13, waveType: 'sine' },
      { id: 3, name: 'Track 3: Grand Worship Piano Bed', stemFilename: 'TRK-15_Grand_Piano_Bed.wav', stemType: 'piano', color: '#f59e0b', freq: 233.08, waveType: 'triangle' },
      { id: 4, name: 'Track 4: Stadium Floor Toms & Timpani Build', stemFilename: 'TRK-15_Floor_Toms_Timpani_74BPM.wav', stemType: 'drums', color: '#ec4899', freq: 77.78, waveType: 'square' }
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
      { tag: 'v2.0', styleName: 'Truck Cab Dawn Master', notes: '5:00 AM freezing rain, amber dashboard dials, vulnerable intimate vocal.' },
      { tag: 'v1.0', styleName: 'Acoustic Solo Sketch', notes: 'Raw acoustic guitar and diesel engine hum.' }
    ],
    stems: [
      { id: 1, name: 'Track 1: Blue-Collar Lead Vocal (Brandon)', stemFilename: 'MMH_Lead_Vocal_Brandon_Dry.wav', stemType: 'vocal', color: '#6366f1', freq: 146.83, waveType: 'sawtooth' },
      { id: 2, name: 'Track 2: Martin D-28 Acoustic & Fingerstyle Chords', stemFilename: 'MMH_Acoustic_Guitar_Bed.wav', stemType: 'guitar', color: '#10b981', freq: 293.66, waveType: 'triangle' },
      { id: 3, name: 'Track 3: Cello & Amber Pad Atmosphere', stemFilename: 'MMH_Cello_Ambient_Pad.wav', stemType: 'organ', color: '#f59e0b', freq: 220, waveType: 'sine' },
      { id: 4, name: 'Track 4: Rain On Windshield Foley & Soft Kick', stemFilename: 'MMH_Rain_Foley_Sub_Drums.wav', stemType: 'drums', color: '#ec4899', freq: 73.42, waveType: 'square' }
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
      { tag: 'v2.0', styleName: 'Heavy Tribal Worship Master', notes: 'Heartbeat sub kicks, massive choral swells, primal blood-covenant imagery.' },
      { tag: 'v1.0', styleName: 'Spoken Word Meditation', notes: 'Quiet breathing, heart monitor pulse, whispered confession.' }
    ],
    stems: [
      { id: 1, name: 'Track 1: Sub-Sonic Steel Lead (Kane)', stemFilename: 'TRK-17_Lead_Vocal_Kane.wav', stemType: 'vocal', color: '#6366f1', freq: 146.83, waveType: 'sawtooth' },
      { id: 2, name: 'Track 2: Deep War Horns & Cello Drone', stemFilename: 'TRK-17_War_Horns_Cello_Drone.wav', stemType: 'organ', color: '#10b981', freq: 293.66, waveType: 'triangle' },
      { id: 3, name: 'Track 3: Anvil Hits & Foley Percussion', stemFilename: 'TRK-17_Anvil_Percussion_Bed.wav', stemType: 'guitar', color: '#f59e0b', freq: 220, waveType: 'sine' },
      { id: 4, name: 'Track 4: Tectonic Low-End Kick & Heartbeat', stemFilename: 'TRK-17_Heartbeat_Tectonic_Kick.wav', stemType: 'drums', color: '#ec4899', freq: 73.42, waveType: 'square' }
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
      { tag: 'v2.0', styleName: 'Modern Tribal Anthem Master', notes: 'Tribal percussion, shofar blasts, corporate worship chant, roaring guitars.' },
      { tag: 'v1.0', styleName: 'Unplugged Sanctuary Chant', notes: 'A cappella gathering around the wooden altar.' }
    ],
    stems: [
      { id: 1, name: 'Track 1: Anthemic Collective Voices & Leads', stemFilename: 'TRK-18_Collective_Leads_Harmonies.wav', stemType: 'vocal', color: '#6366f1', freq: 220, waveType: 'sawtooth' },
      { id: 2, name: 'Track 2: Shofar & Distorted Electric Guitar', stemFilename: 'TRK-18_Shofar_Electric_Guitar.wav', stemType: 'guitar', color: '#10b981', freq: 440, waveType: 'square' },
      { id: 3, name: 'Track 3: Cathedral Organ & Synth Drone', stemFilename: 'TRK-18_Cathedral_Organ_Synth_Bed.wav', stemType: 'organ', color: '#f59e0b', freq: 330, waveType: 'sine' },
      { id: 4, name: 'Track 4: Thunderous Floor Toms & War Drums', stemFilename: 'TRK-18_Thunderous_War_Drums_84BPM.wav', stemType: 'drums', color: '#ec4899', freq: 110, waveType: 'triangle' }
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
      { tag: 'v2.0', styleName: 'Battleground Roots Rock Master', notes: 'Screaming harmonica, slide dobro, swamp stomp, fiery vocal duel.' },
      { tag: 'v1.0', styleName: 'Campfire Dual-Acoustic', notes: 'Two battered dreadnought guitars and gravel whispers.' }
    ],
    stems: [
      { id: 1, name: 'Track 1: Weathered Dual Lead (Brandon & Silas)', stemFilename: 'TRK-19_Dual_Lead_Brandon_Silas.wav', stemType: 'vocal', color: '#6366f1', freq: 164.81, waveType: 'sawtooth' },
      { id: 2, name: 'Track 2: Blues Harmonica & Resonator Dobro', stemFilename: 'TRK-19_Harmonica_Slide_Dobro.wav', stemType: 'guitar', color: '#10b981', freq: 329.63, waveType: 'triangle' },
      { id: 3, name: 'Track 3: Overdriven Swamp Bassline', stemFilename: 'TRK-19_Swamp_Overdriven_Bass.wav', stemType: 'bass', color: '#f59e0b', freq: 82.41, waveType: 'sine' },
      { id: 4, name: 'Track 4: Heavy Mud-Stomp Drums & Chains', stemFilename: 'TRK-19_Mud_Stomp_Chains_Drums.wav', stemType: 'drums', color: '#ec4899', freq: 82.41, waveType: 'square' }
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
      { tag: 'v2.0', styleName: 'Industrial CHH Cyber-Master', notes: 'Dark electro-industrial basslines, heavy mechanical beats, razor lyric delivery.' },
      { tag: 'v1.0', styleName: 'Analog Synthesizer Jam', notes: 'Vintage Moog analog synth improvisations.' }
    ],
    stems: [
      { id: 1, name: 'Track 1: Dual Cyber Rap (The Architect & Kane)', stemFilename: 'TRK-20_Cyber_Rap_Architect_Kane.wav', stemType: 'vocal', color: '#6366f1', freq: 155.56, waveType: 'sawtooth' },
      { id: 2, name: 'Track 2: Modular Acid Bassline & Saws', stemFilename: 'TRK-20_Acid_Modular_Bassline.wav', stemType: 'bass', color: '#10b981', freq: 77.78, waveType: 'square' },
      { id: 3, name: 'Track 3: Distorted Industrial FX & Synth Pad', stemFilename: 'TRK-20_Industrial_FX_Pads.wav', stemType: 'organ', color: '#f59e0b', freq: 311.13, waveType: 'triangle' },
      { id: 4, name: 'Track 4: Hard Industrial Drum Machine 130 BPM', stemFilename: 'TRK-20_Industrial_Drums_130BPM.wav', stemType: 'drums', color: '#ec4899', freq: 77.78, waveType: 'square' }
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
      { tag: 'v2.0', styleName: 'Resurrection Dawn Full Choir', notes: 'Full Ms T choir crescendo, triumphant brass, soaring synthesizer hooks.' }
    ],
    stems: [
      { id: 1, name: 'Track 1: Lead Praise Vocal (Mrs T)', stemFilename: 'TRK-21_Lead_Vocal_MrsT_Clean.wav', stemType: 'vocal', color: '#6366f1', freq: 196, waveType: 'sawtooth' },
      { id: 2, name: 'Track 2: Ruach Choir Harmonies & Ad-libs', stemFilename: 'TRK-21_Choir_Harmonies_UVR5.wav', stemType: 'choir', color: '#10b981', freq: 293.66, waveType: 'triangle' },
      { id: 3, name: 'Track 3: Modern Brass & Synth Arp Bed', stemFilename: 'TRK-21_Brass_Synth_Bed.wav', stemType: 'organ', color: '#f59e0b', freq: 392, waveType: 'sawtooth' },
      { id: 4, name: 'Track 4: 128 BPM Four-on-the-Floor Drums & Bass', stemFilename: 'TRK-21_Driving_Drums_Bass.wav', stemType: 'drums', color: '#ec4899', freq: 98, waveType: 'square' }
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
      { tag: 'v2.0', styleName: 'Valley of Dry Bones Cinematic Master', notes: 'Ezekiel 37 vision, wind foley, swelling cellos, explosive resurrection chorus.' },
      { tag: 'v1.0', styleName: 'Acoustic Awakening', notes: 'Intimate guitar sketch at daybreak.' }
    ],
    stems: [
      { id: 1, name: 'Track 1: Dual Sacred Lead (Brandon & Ms T)', stemFilename: 'TRK-22_Dual_Lead_Brandon_MsT.wav', stemType: 'vocal', color: '#6366f1', freq: 146.83, waveType: 'sawtooth' },
      { id: 2, name: 'Track 2: Soaring Cello & French Horn Section', stemFilename: 'TRK-22_Cello_French_Horn_Swell.wav', stemType: 'organ', color: '#10b981', freq: 293.66, waveType: 'sine' },
      { id: 3, name: 'Track 3: Acoustic 12-String Guitar Bed', stemFilename: 'TRK-22_Acoustic_12String_Guitar.wav', stemType: 'guitar', color: '#f59e0b', freq: 220, waveType: 'triangle' },
      { id: 4, name: 'Track 4: Rolling Orchestral Percussion & Timpani', stemFilename: 'TRK-22_Rolling_Timpani_Drums.wav', stemType: 'drums', color: '#ec4899', freq: 73.42, waveType: 'square' }
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
      { tag: 'v2.0', styleName: 'Country EDM Dancefloor Cut', notes: 'Banjo and fiddle meets 128 BPM supersaws, dance drop, triumphant vocal hook.' },
      { tag: 'v1.0', styleName: 'Porch Acoustic Duet', notes: 'Front porch picking with acoustic bass and foot tap.' }
    ],
    stems: [
      { id: 1, name: 'Track 1: Harmonized Duet (Monica & Silas)', stemFilename: 'TRK-23_Lead_Duet_Monica_Silas.wav', stemType: 'vocal', color: '#6366f1', freq: 220, waveType: 'sawtooth' },
      { id: 2, name: 'Track 2: Country Fiddle & Electric Banjo Riffs', stemFilename: 'TRK-23_Fiddle_Electric_Banjo.wav', stemType: 'guitar', color: '#10b981', freq: 440, waveType: 'triangle' },
      { id: 3, name: 'Track 3: Progressive CEDM Supersaws & Pads', stemFilename: 'TRK-23_CEDM_Supersaws_Pads.wav', stemType: 'organ', color: '#f59e0b', freq: 330, waveType: 'sine' },
      { id: 4, name: 'Track 4: High-Energy Country Dance Drums 128 BPM', stemFilename: 'TRK-23_Country_Dance_Drums_128BPM.wav', stemType: 'drums', color: '#ec4899', freq: 110, waveType: 'square' }
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
      { tag: 'v2.0', styleName: 'A Cappella to Full Gospel Eruption', notes: 'Quiet confession turning into massive gospel choir and screaming Hammond B3.' },
      { tag: 'v1.0', styleName: 'Stripped Confession', notes: 'Pure spoken word with ambient church echo.' }
    ],
    stems: [
      { id: 1, name: 'Track 1: Vulnerable Spoken Word to Belt (Silas)', stemFilename: 'TRK-24_Lead_Vocal_Silas.wav', stemType: 'vocal', color: '#6366f1', freq: 155.56, waveType: 'sawtooth' },
      { id: 2, name: 'Track 2: 4-Part Gospel Harmony Choir', stemFilename: 'TRK-24_Gospel_Harmony_Choir.wav', stemType: 'choir', color: '#10b981', freq: 311.13, waveType: 'triangle' },
      { id: 3, name: 'Track 3: B3 Organ Crescendo (Leslie Fast)', stemFilename: 'TRK-24_Hammond_B3_Crescendo.wav', stemType: 'organ', color: '#f59e0b', freq: 233.08, waveType: 'sine' },
      { id: 4, name: 'Track 4: Slow-Burn Gospel Groove & Bass', stemFilename: 'TRK-24_Gospel_Groove_Bass_82BPM.wav', stemType: 'drums', color: '#ec4899', freq: 77.78, waveType: 'square' }
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
      { tag: 'v2.0', styleName: 'Deep Soulful Alto Anthem', notes: 'Warm Wurlitzer electric piano, upright bass, tender brushed drums, soulful sanctuary reflection.' },
      { tag: 'v1.0', styleName: 'Intimate Midnight Piano', notes: 'Late-night devotional keys and gentle humming.' }
    ],
    stems: [
      { id: 1, name: 'Track 1: Majestic Alto Lead (Ms T)', stemFilename: 'TRK-25_Lead_Vocal_MsT.wav', stemType: 'vocal', color: '#6366f1', freq: 174.61, waveType: 'sawtooth' },
      { id: 2, name: 'Track 2: Wurlitzer Electric Piano & Rhodes Bed', stemFilename: 'TRK-25_Wurlitzer_Rhodes_Bed.wav', stemType: 'piano', color: '#10b981', freq: 349.23, waveType: 'sine' },
      { id: 3, name: 'Track 3: Upright Acoustic Bassline', stemFilename: 'TRK-25_Upright_Acoustic_Bass.wav', stemType: 'bass', color: '#f59e0b', freq: 87.31, waveType: 'triangle' },
      { id: 4, name: 'Track 4: Brushed Snare & Ambient Room Foley', stemFilename: 'TRK-25_Brushed_Snare_Foley_70BPM.wav', stemType: 'drums', color: '#ec4899', freq: 87.31, waveType: 'square' }
    ],
    visualTitle: 'Open Door into Endless Green Pastures at Dawn',
    sceneTitle: 'Resting in the Sufficiency of Christ'
  },
  {
    trackId: 'TRK-26',
    title: 'Meet Me Here (Harder Scream)',
    folderName: 'Meet-Me-Here-Scream',
    aliases: ['TRK-26', 'Meet-Me-Here-Scream', 'MMH_Harder_Scream', 'Meet Me Here (Harder Scream)', 'MMH-Scream', '00-Active_Projects/Meet-Me-Here-Scream'],
    bpm: 76,
    key: 'D Minor',
    genre: 'Heavy Screamo / Post-Hardcore Devotional',
    vocal: 'Brandon (Raw Scream & Growl)',
    versions: [
      { tag: 'v2.0', styleName: 'Full Post-Hardcore Cut', notes: 'Wall of distorted guitars, double-bass drum breakdown, visceral screams.' }
    ],
    stems: [
      { id: 1, name: 'Track 1: Visceral Screamo Lead (Brandon)', stemFilename: 'TRK-26_Lead_Scream_Vocal_Clean.wav', stemType: 'vocal', color: '#6366f1', freq: 146.83, waveType: 'sawtooth' },
      { id: 2, name: 'Track 2: Dual High-Gain Distorted Guitars', stemFilename: 'TRK-26_Distorted_Guitars_Wall.wav', stemType: 'guitar', color: '#10b981', freq: 293.66, waveType: 'square' },
      { id: 3, name: 'Track 3: Distorted Overdriven Bass Guitar', stemFilename: 'TRK-26_Overdriven_Bass_Guitar.wav', stemType: 'bass', color: '#f59e0b', freq: 73.42, waveType: 'sawtooth' },
      { id: 4, name: 'Track 4: Double-Kick Drum Breakdown', stemFilename: 'TRK-26_Double_Kick_Heavy_Drums.wav', stemType: 'drums', color: '#ec4899', freq: 73.42, waveType: 'square' }
    ],
    visualTitle: 'Screaming Steel Foundry and Smoldering Sparks',
    sceneTitle: 'Gethsemane Agony Under Heavy Rain'
  },
  {
    trackId: 'TRK-27',
    title: "The Work Ain't Done",
    folderName: 'The-Work-Aint-Done',
    aliases: ['TWAD', 'The-Work-Aint-Done', 'The_Work_Aint_Done', "The Work Ain't Done", 'TRK-27', 'WorkAintDone', '00-Active_Projects/The-Work-Aint-Done'],
    bpm: 102,
    key: 'G Minor',
    genre: 'Folk-Hop / Boom-Bap CHH / K-Pop Ministry Hybrid',
    vocal: 'The Pop Prodigy / Kane / Ms T',
    versions: [
      { tag: 'v8.0', styleName: 'Male K-Pop Remix (128 BPM)', notes: 'Male K-Pop Remix, future bass drop, supersaws, choreography break.' },
      { tag: 'v3.0', styleName: 'Nashville Folk-Hop Radio Master (102 BPM)', notes: 'Acoustic Martin guitar, banjo licks, warm upright bass, soulful chorus.' },
      { tag: 'v1.0', styleName: 'Acoustic Nightshift Blueprint (72 BPM)', notes: 'Intimate 3:00 AM hospital acoustic guitar and raw vocal prayer.' }
    ],
    stems: [
      { id: 1, name: 'Track 1: Lead Vocal (The Pop Prodigy / Kane / Ms T) [BS-Roformer]', stemFilename: 'TWAD_Lead_Vocal_Clean_BS-Roformer.wav', stemType: 'vocal', color: '#6366f1', freq: 196, waveType: 'sawtooth' },
      { id: 2, name: 'Track 2: Martin D-28 Acoustic & Banjo Riffs', stemFilename: 'TWAD_Acoustic_Martin_Banjo_Bed.wav', stemType: 'guitar', color: '#10b981', freq: 392, waveType: 'triangle' },
      { id: 3, name: 'Track 3: Upright Acoustic Bass & 808 Bed', stemFilename: 'TWAD_Upright_Bass_808_Sub.wav', stemType: 'bass', color: '#f59e0b', freq: 98, waveType: 'sine' },
      { id: 4, name: 'Track 4: Boom-Bap & Stomp Rhythm Groove (102 BPM)', stemFilename: 'TWAD_BoomBap_Stomp_Drums_102BPM.wav', stemType: 'drums', color: '#ec4899', freq: 98, waveType: 'square' }
    ],
    visualTitle: 'Hospital Emergency Bay Glass Reflecting Sunrise and Stethoscope',
    sceneTitle: 'Standing in the Gap at Discharge'
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
    const webdavPath = `${folderPath}/${def.folderName}_Master_${ver.tag}_24bit48k.wav`;
    const audioUrl = buildNextcloudStreamUrl(webdavPath);
    assets.push({
      id: `NC-${def.trackId}-M${idx + 1}`,
      name: `${def.title} - ${ver.tag} (${ver.styleName})`,
      filename: `${def.folderName}_Master_${ver.tag}_${ver.styleName.replace(/\s+/g, '_')}_24bit48k.wav`,
      folderId: def.folderName,
      category: 'MASTER_AUDIO',
      fileSizeBytes: 52428800 + idx * 2000000,
      fileSizeFormatted: `${(50 + idx * 2.5).toFixed(1)} MB`,
      mimeType: 'audio/wav',
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
      notes: `${ver.tag} (${ver.styleName}): ${ver.notes} 24-bit/48kHz Master Print. Nashville LUFS -14.1 compliant.`,
      lastSyncedAt: new Date().toISOString(),
      tags: [def.folderName, def.title, def.trackId, ver.tag, 'Master WAV', 'Fiber Synced']
    });
  });

  // 2. Stems
  def.stems.forEach((stem) => {
    const webdavPath = `${folderPath}/stems/${stem.stemFilename}`;
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
    const webdavPath = `${folderPath}/stems/${s.stemFilename}`;
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
