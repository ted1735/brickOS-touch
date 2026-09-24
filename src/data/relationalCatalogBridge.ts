import {
  Track,
  VocalArchetypeRecord,
  OfficialVocalArchetype,
  AudioStemRecord,
  VisualAssetRecord,
  InterchangeableAssetLink,
} from '../types';

// ==============================================================================
// 1. LIVE NEXTCLOUD WEBDAV ENDPOINT CONFIGURATION
// ==============================================================================
export const PRODUCTION_NEXTCLOUD_WEBDAV = 'https://nextcloud.moyercloud.com/remote.php/dav/files/ncted/Music-Production';
export const PRODUCTION_NEXTCLOUD_BASE = 'https://nextcloud.moyercloud.com/remote.php/dav/files/ncted/Music-Production';
export const DEFAULT_WEBDAV_USER = 'ncted';

/**
 * Dynamic WebDAV Asset Resolution
 * Generates exact live WebDAV URL matching sovereign folder structure in /Music-Production:
 * Visuals: https://nextcloud.moyercloud.com/remote.php/dav/files/ncted/Music-Production/[TRK-ID]/visuals/[version]/[filename]
 * Stems:   https://nextcloud.moyercloud.com/remote.php/dav/files/ncted/Music-Production/[TRK-ID]/stems/[filename]
 * Shared:  https://nextcloud.moyercloud.com/remote.php/dav/files/ncted/Music-Production/shared/[collection]/[filename]
 */
export function resolveWebDavAssetUrl(
  trackId: string,
  category: 'stems' | 'visuals' | 'shared',
  filename: string,
  version: string = 'v1.0'
): string {
  const cleanTrack = trackId.toUpperCase().trim();
  const cleanFile = filename.trim();
  if (category === 'stems') {
    return `${PRODUCTION_NEXTCLOUD_WEBDAV}/${cleanTrack}/stems/${cleanFile}`;
  }
  if (category === 'visuals') {
    return `${PRODUCTION_NEXTCLOUD_WEBDAV}/${cleanTrack}/visuals/${version}/${cleanFile}`;
  }
  return `${PRODUCTION_NEXTCLOUD_WEBDAV}/shared/${cleanFile}`;
}

// ==============================================================================
// 2. OFFICIAL VOCAL ARCHETYPES ROSTER
// ==============================================================================
export const OFFICIAL_VOCAL_ARCHETYPES: VocalArchetypeRecord[] = [
  {
    name: 'The Architect',
    archetypeTitle: 'Sub-Sonic Quarry Authority',
    role: 'Foundational Boom-Bap & Heavy CHH Emcee',
    formantTexture: 'Deep sub-chest rumble, grounded MPC pocket, dry unhyped authority',
    recommendedGenres: 'Christian Hip Hop, Boom-Bap, Spoken Word, Cinematic Trailer',
  },
  {
    name: 'Brandon',
    archetypeTitle: 'Weary Father & Craftsman Rasp',
    role: 'Acoustic Heartland, Folk Worship, Vulnerable Narrative Lead',
    formantTexture: 'Aged cedar texture, breathy intimate proximity, earnest falsetto breaks',
    recommendedGenres: 'Modern Folk Worship, Blue-Collar Gothic CHH, Acoustic Stomp',
  },
  {
    name: 'Ms T',
    archetypeTitle: 'Emotive B3 Gospel Raw Power',
    role: 'Soulful Gospel Choir Lead, High-Dynamic Belter, Victory Anthem',
    formantTexture: 'Full chest belting, vibrato with holy resonance, overdriven B3 organ warmth',
    recommendedGenres: 'Soulful Gospel, Modern Revival Hymns, Orchestral Worship',
  },
  {
    name: 'Monica',
    archetypeTitle: 'Gritty Soulful Athletic Trap',
    role: 'High-Energy Festival Anthems, Duet Power, Fitness Anthems',
    formantTexture: 'Raspy mid-range bite, aggressive syncopation, modern CEDM shine',
    recommendedGenres: 'CEDM, Trap-Gospel, High-Pacing Workout CHH, Duets',
  },
  {
    name: 'Kane',
    archetypeTitle: 'Sub-Sonic Steel & Drop-D Guttural',
    role: 'Dark Industrial CHH, Hard Rock, Aggressive Spiritual Warfare',
    formantTexture: 'Sub-bass chest growl, aggressive compression tolerance, industrial edge',
    recommendedGenres: 'Dark Industrial CHH, Trap Metal, Stadium Hard Rock',
  },
  {
    name: 'PATD',
    archetypeTitle: 'Emotive Deep Resonance & Soaring Tenor',
    role: 'Soul Piano Ballad, Cinematic Neo-Soul, Vulnerable Melodic Dubstep',
    formantTexture: 'Felt piano proximity, dramatic dynamic swell from whisper to soaring cry',
    recommendedGenres: 'Melodic Dubstep, Neo-Classical, Ambient Soul',
  },
  {
    name: 'Silas Thorne',
    archetypeTitle: 'Aged Oak Resonator Rasp',
    role: 'Blue-Collar Gothic, Outlaw Country, 5 AM Diesel Reflections',
    formantTexture: 'Weathered smoke, slide resonator warmth, unvarnished truth',
    recommendedGenres: 'Outlaw Country CHH, Blue-Collar Gothic, Celtic Folk',
  },
  {
    name: 'Neon Gospel',
    archetypeTitle: 'Hyper-Pop Shimmer & Glitch Trap',
    role: 'K-Pop Fusion, Glitch Anthems, High-Frequency Piercing Energy',
    formantTexture: 'Crystal vocal formant, wide stereo double-track, sparkling high-shelf EQ',
    recommendedGenres: 'K-Pop Fusion, Glitch Trap, Electronic Worship Drops',
  },
];

// ==============================================================================
// 3. INTERCHANGEABLE ASSET SIMILARITY MATRIX
// ==============================================================================
export const INTERCHANGEABLE_ASSET_MATRIX: InterchangeableAssetLink[] = [
  // --- CLUSTER 1: SANCTUARY & CROSS (#Theme_SanctuaryCross) ---
  // Interchangeable across TRK-01, TRK-03, TRK-04, and TRK-24
  {
    id: 'SIM-01',
    primaryTrackId: 'TRK-03',
    title: 'Candle-Gospel Bedside & Cathedral Sanctuary',
    assetCategory: 'TRACK_BOUND',
    assetType: 'VISUAL',
    webdavRelativePath: 'TRK-03/visuals/v1.0/Candle-Gospel_Bedside_Altar_Plate_16x9.png',
    fullWebdavUrl: `${PRODUCTION_NEXTCLOUD_WEBDAV}/TRK-03/visuals/v1.0/Candle-Gospel_Bedside_Altar_Plate_16x9.png`,
    similarityTags: [
      '#Theme_SanctuaryCross',
      '#Visual_Chiaroscuro',
      '#Interchangeable_With_TRK01_TRK03_TRK04_TRK24',
      '#Beeswax_Candle',
      '#Cathedral_Light',
    ],
    compatibleTracks: ['TRK-01', 'TRK-03', 'TRK-04', 'TRK-24'],
    themeCluster: 'Theme_SanctuaryCross',
    description: 'Flickering beeswax candle in a darkened stone cathedral, illuminating ancient limestone and sanctuary cross shadows. Perfectly interchangeable for foundational gospel and resurrection tracks.',
    previewUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'SIM-02',
    primaryTrackId: 'TRK-04',
    title: 'cross-assets Weathered Cedar Beam at Dawn',
    assetCategory: 'TRACK_BOUND',
    assetType: 'VISUAL',
    webdavRelativePath: 'TRK-04/visuals/v1.0/cross-assets_Weathered_Cedar_Cross_4k_1x1.png',
    fullWebdavUrl: `${PRODUCTION_NEXTCLOUD_WEBDAV}/TRK-04/visuals/v1.0/cross-assets_Weathered_Cedar_Cross_4k_1x1.png`,
    similarityTags: [
      '#Theme_SanctuaryCross',
      '#Ancient_Timber',
      '#Interchangeable_With_TRK01_TRK03_TRK04_TRK24',
      '#Redemption_Blood',
      '#Cornerstone',
    ],
    compatibleTracks: ['TRK-01', 'TRK-03', 'TRK-04', 'TRK-24'],
    themeCluster: 'Theme_SanctuaryCross',
    description: 'Massive hand-hewn cedar cross set against morning fog with crimson horizon glow. Symbolizes foundation stone and unyielding covenant.',
    previewUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'SIM-03',
    primaryTrackId: 'TRK-24',
    title: 'Holy Ruach Golden Wind in Ancient Sanctuary',
    assetCategory: 'TRACK_BOUND',
    assetType: 'VIDEO_PLATE',
    webdavRelativePath: 'TRK-24/visuals/v1.0/Breath_And_Bone_Ruach_Sanctuary_Loop_9x16.mp4',
    fullWebdavUrl: `${PRODUCTION_NEXTCLOUD_WEBDAV}/TRK-24/visuals/v1.0/Breath_And_Bone_Ruach_Sanctuary_Loop_9x16.mp4`,
    similarityTags: [
      '#Theme_SanctuaryCross',
      '#Ruach_Wind',
      '#Resurrection_Light',
      '#Interchangeable_With_TRK01_TRK03_TRK04_TRK24',
    ],
    compatibleTracks: ['TRK-01', 'TRK-03', 'TRK-04', 'TRK-24'],
    themeCluster: 'Theme_SanctuaryCross',
    description: 'Swirling golden vortex of holy desert wind sweeping through cathedral pillars, lifting bleached bone dust into living light.',
    previewUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
  },

  // --- CLUSTER 2: BLUE-COLLAR GRIT (#Theme_BlueCollarGrit) ---
  // Linked across TRK-07, TRK-09, TRK-13, and TRK-14
  {
    id: 'SIM-04',
    primaryTrackId: 'TRK-13',
    title: '5 AM Rain-Soaked Diesel Cab & Knees in Mud',
    assetCategory: 'TRACK_BOUND',
    assetType: 'VISUAL',
    webdavRelativePath: 'TRK-13/visuals/v1.0/Meet_Me_Here_5AM_Rain_Diesel_Cab_9x16.png',
    fullWebdavUrl: `${PRODUCTION_NEXTCLOUD_WEBDAV}/TRK-13/visuals/v1.0/Meet_Me_Here_5AM_Rain_Diesel_Cab_9x16.png`,
    similarityTags: [
      '#Theme_BlueCollarGrit',
      '#Diesel_5AM',
      '#Rain_On_Glass',
      '#Interchangeable_With_TRK07_TRK09_TRK13_TRK14',
      '#Weary_Father',
    ],
    compatibleTracks: ['TRK-07', 'TRK-09', 'TRK-13', 'TRK-14'],
    themeCluster: 'Theme_BlueCollarGrit',
    description: 'Intimate close-up inside a pickup truck cab at 5:00 AM; rain streaming down the cold windshield, glowing amber dash gauges, knees on soaked gravel.',
    previewUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'SIM-05',
    primaryTrackId: 'TRK-14',
    title: 'Sawdust Blueprint & Workboots in Red Dirt',
    assetCategory: 'TRACK_BOUND',
    assetType: 'VISUAL',
    webdavRelativePath: 'TRK-14/visuals/v1.0/Blueprint_Sawdust_Workboots_RedDirt_1x1.png',
    fullWebdavUrl: `${PRODUCTION_NEXTCLOUD_WEBDAV}/TRK-14/visuals/v1.0/Blueprint_Sawdust_Workboots_RedDirt_1x1.png`,
    similarityTags: [
      '#Theme_BlueCollarGrit',
      '#Workshop_Craft',
      '#Workboots_Mud',
      '#Interchangeable_With_TRK07_TRK09_TRK13_TRK14',
      '#Fatherhood_Trade',
    ],
    compatibleTracks: ['TRK-07', 'TRK-09', 'TRK-13', 'TRK-14'],
    themeCluster: 'Theme_BlueCollarGrit',
    description: 'Weathered cedar woodshop with golden shavings curling from a lathe, architectural blueprint with pencil marks, heavy workboots on concrete.',
    previewUrl: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'SIM-06',
    primaryTrackId: 'TRK-09',
    title: 'Calvary Grit Barbed Wire & Desert Rain Steaming',
    assetCategory: 'TRACK_BOUND',
    assetType: 'VISUAL',
    webdavRelativePath: 'TRK-09/visuals/v1.0/Calvary_Grit_Anvil_Steaming_Rain_16x9.png',
    fullWebdavUrl: `${PRODUCTION_NEXTCLOUD_WEBDAV}/TRK-09/visuals/v1.0/Calvary_Grit_Anvil_Steaming_Rain_16x9.png`,
    similarityTags: [
      '#Theme_BlueCollarGrit',
      '#Heavy_Anvil',
      '#West_Texas_Grit',
      '#Interchangeable_With_TRK07_TRK09_TRK13_TRK14',
      '#Gridiron_Discipline',
    ],
    compatibleTracks: ['TRK-07', 'TRK-09', 'TRK-13', 'TRK-14'],
    themeCluster: 'Theme_BlueCollarGrit',
    description: 'Weathered blacksmith anvil outdoors in driving Texas rain; red-hot steel steaming as cold droplets hit, dark mud and rusted barbed wire fence.',
    previewUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'SIM-07',
    primaryTrackId: 'TRK-07',
    title: 'Check Heart Light Amber Dash Conviction',
    assetCategory: 'TRACK_BOUND',
    assetType: 'VISUAL',
    webdavRelativePath: 'TRK-07/visuals/v1.0/Check_Heart_Light_Amber_Gauges_1x1.png',
    fullWebdavUrl: `${PRODUCTION_NEXTCLOUD_WEBDAV}/TRK-07/visuals/v1.0/Check_Heart_Light_Amber_Gauges_1x1.png`,
    similarityTags: [
      '#Theme_BlueCollarGrit',
      '#Engine_Warning_Light',
      '#Interchangeable_With_TRK07_TRK09_TRK13_TRK14',
      '#Altar_Popping_Hood',
    ],
    compatibleTracks: ['TRK-07', 'TRK-09', 'TRK-13', 'TRK-14'],
    themeCluster: 'Theme_BlueCollarGrit',
    description: 'Macro of glowing amber check-engine icon reflecting on a dusty dashboard; oil stains, rain streaks, popping the hood at the altar.',
    previewUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80',
  },

  // --- CLUSTER 3: SHARED CROSS-CATALOG COLLECTIONS (#CrossCatalog_BRoll & #Universal) ---
  {
    id: 'SIM-08',
    title: 'General Video Assets: 4K Atmospheric Rain & Chiaroscuro Altar',
    assetCategory: 'CROSS_CATALOG_SHARED',
    assetType: 'VIDEO_PLATE',
    webdavRelativePath: 'shared/General_Video_Assets/Atmospheric_Rain_Chiaroscuro_Plate_4k.mp4',
    fullWebdavUrl: `${PRODUCTION_NEXTCLOUD_WEBDAV}/shared/General_Video_Assets/Atmospheric_Rain_Chiaroscuro_Plate_4k.mp4`,
    similarityTags: [
      '#CrossCatalog_BRoll',
      '#Universal',
      '#Visual_Chiaroscuro',
      '#Church_Sanctuary',
      '#Ambient_Rain',
    ],
    compatibleTracks: ['ALL_CATALOG'],
    themeCluster: 'CrossCatalog_BRoll',
    description: 'High-framerate 60fps cinematic slow-motion b-roll of rain streaming down cathedral glass windows into dark wood pews; cross-catalog master B-Roll.',
    previewUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'SIM-09',
    title: 'Logos-Branding: BRICK Master Kintsugi Gold Emblem',
    assetCategory: 'CROSS_CATALOG_SHARED',
    assetType: 'BRANDING',
    webdavRelativePath: 'shared/Logos-Branding/BRICK_Master_Kintsugi_Gold_Emblem_4k.png',
    fullWebdavUrl: `${PRODUCTION_NEXTCLOUD_WEBDAV}/shared/Logos-Branding/BRICK_Master_Kintsugi_Gold_Emblem_4k.png`,
    similarityTags: [
      '#Brand_Asset',
      '#Universal',
      '#Kintsugi_Gold',
      '#BRICK_MasterLogo',
      '#Alpha_Transparent',
    ],
    compatibleTracks: ['ALL_CATALOG'],
    themeCluster: 'Universal',
    description: 'Official high-resolution transparent PNG of the brickOS/BRICK Records gold kintsugi cornerstone emblem. Universal brand overlay for all album art and videos.',
    previewUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'SIM-10',
    title: 'Song2Sing: Acoustic & Piano Reference Stems (Benchmark)',
    assetCategory: 'CROSS_CATALOG_SHARED',
    assetType: 'AUDIO_STEM',
    webdavRelativePath: 'shared/Song2Sing/Acoustic_Worship_Vocal_Benchmark_24bit_48k.wav',
    fullWebdavUrl: `${PRODUCTION_NEXTCLOUD_WEBDAV}/shared/Song2Sing/Acoustic_Worship_Vocal_Benchmark_24bit_48k.wav`,
    similarityTags: [
      '#Universal',
      '#Vocal_Benchmark',
      '#Covers_Acoustic',
      '#Vocal_Isolation_Stem',
      '#24bit_48kHz',
    ],
    compatibleTracks: ['ALL_CATALOG'],
    themeCluster: 'Universal',
    description: 'Master studio reference stems for vocal tracking and pitch benchmark. Clean linear 24-bit/48kHz PCM recording used for UVR5 comparison tests.',
  },

  // --- CLUSTER 4: SURRENDER & KINTSUGI MASK (#Theme_SurrenderMask) ---
  {
    id: 'SIM-11',
    primaryTrackId: 'TRK-23',
    title: 'Trading In The Mask: Cracked Porcelain Kintsugi',
    assetCategory: 'TRACK_BOUND',
    assetType: 'VISUAL',
    webdavRelativePath: 'TRK-23/visuals/v1.0/Trading_Mask_Kintsugi_Porcelain_1x1.png',
    fullWebdavUrl: `${PRODUCTION_NEXTCLOUD_WEBDAV}/TRK-23/visuals/v1.0/Trading_Mask_Kintsugi_Porcelain_1x1.png`,
    similarityTags: [
      '#Theme_SurrenderMask',
      '#Kintsugi_Gold',
      '#Porcelain_Altar',
      '#Interchangeable_With_TRK23_TRK25_TRK13',
    ],
    compatibleTracks: ['TRK-23', 'TRK-25', 'TRK-13'],
    themeCluster: 'Theme_SurrenderMask',
    description: 'White theatrical porcelain mask shattered on an ancient limestone altar, seams mended with molten 24k gold. Represents emotional surrender and vulnerability.',
    previewUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800&auto=format&fit=crop&q=80',
  },
];

// ==============================================================================
// 4. GENERATE AUDIO STEMS RECORD FOR ANY TRACK
// ==============================================================================
export function getTrackStems(trackId: string): AudioStemRecord[] {
  const cleanId = trackId.toUpperCase();
  return [
    {
      id: `${cleanId}-STEM-01`,
      trackId: cleanId,
      passType: 'Primary_Vocal',
      modelUsed: 'BS-Roformer-Viperx-1297 (Lead Vocal Isolation)',
      isCompleted: true,
      webdavRelativePath: `Music-Production/${cleanId}/stems/${cleanId}_BS-Roformer_Vocal_24bit_48k.wav`,
      fullWebdavUrl: `${PRODUCTION_NEXTCLOUD_WEBDAV}/${cleanId}/stems/${cleanId}_BS-Roformer_Vocal_24bit_48k.wav`,
      fileSizeBytes: 42500000,
      sampleRateHz: 48000,
      bitDepth: 24,
    },
    {
      id: `${cleanId}-STEM-02`,
      trackId: cleanId,
      passType: 'True_Instrumental',
      modelUsed: 'Kim-Inst-v2-HQ (True Instrumental Extraction)',
      isCompleted: true,
      webdavRelativePath: `Music-Production/${cleanId}/stems/${cleanId}_KimInst_Instrumental_24bit_48k.wav`,
      fullWebdavUrl: `${PRODUCTION_NEXTCLOUD_WEBDAV}/${cleanId}/stems/${cleanId}_KimInst_Instrumental_24bit_48k.wav`,
      fileSizeBytes: 58900000,
      sampleRateHz: 48000,
      bitDepth: 24,
    },
    {
      id: `${cleanId}-STEM-03`,
      trackId: cleanId,
      passType: 'Dry_Studio_Vocal',
      modelUsed: 'FoxJoy-DeReverb-v3 (Room Tone & Sibilance Stripper)',
      isCompleted: true,
      webdavRelativePath: `Music-Production/${cleanId}/stems/${cleanId}_FoxJoy_Dereverb_DryVocal_24bit_48k.wav`,
      fullWebdavUrl: `${PRODUCTION_NEXTCLOUD_WEBDAV}/${cleanId}/stems/${cleanId}_FoxJoy_Dereverb_DryVocal_24bit_48k.wav`,
      fileSizeBytes: 41800000,
      sampleRateHz: 48000,
      bitDepth: 24,
    },
    {
      id: `${cleanId}-STEM-04`,
      trackId: cleanId,
      passType: 'DAW_Master_Session',
      modelUsed: 'Nashville-Linear-Master-Bus (Cakewalk / ProTools)',
      isCompleted: true,
      webdavRelativePath: `Music-Production/${cleanId}/stems/${cleanId}_DAW_Master_24bit_48k.wav`,
      fullWebdavUrl: `${PRODUCTION_NEXTCLOUD_WEBDAV}/${cleanId}/stems/${cleanId}_DAW_Master_24bit_48k.wav`,
      fileSizeBytes: 72400000,
      sampleRateHz: 48000,
      bitDepth: 24,
    },
  ];
}

// ==============================================================================
// 5. GENERATE VISUAL ASSETS FOR ANY TRACK
// ==============================================================================
export function getTrackVisualAssets(track: Track): VisualAssetRecord[] {
  const cleanId = track.id.toUpperCase();
  const cleanTitle = track.title.replace(/[^a-zA-Z0-9]/g, '_');
  return [
    {
      id: `${cleanId}-VIS-01`,
      trackId: cleanId,
      versionId: 'v1.0',
      assetType: 'Album_Cover_Master',
      aspectRatio: '1:1',
      title: `${track.title} - Official Master Cover Art`,
      prompt: `Cinematic album cover for ${track.title}, ${track.genre}, ${track.thesis}, warm chiaroscuro lighting, photorealistic 8k`,
      isActiveMaster: true,
      webdavRelativePath: `Music-Production/${cleanId}/visuals/v1.0/${cleanId}_CoverArt_${cleanTitle}_1x1.png`,
      fullWebdavUrl: `${PRODUCTION_NEXTCLOUD_WEBDAV}/${cleanId}/visuals/v1.0/${cleanId}_CoverArt_${cleanTitle}_1x1.png`,
      similarityTags: cleanId === 'TRK-01' || cleanId === 'TRK-03' || cleanId === 'TRK-04' || cleanId === 'TRK-24'
        ? ['#Theme_SanctuaryCross', '#Album_Cover_Master']
        : cleanId === 'TRK-07' || cleanId === 'TRK-09' || cleanId === 'TRK-13' || cleanId === 'TRK-14'
        ? ['#Theme_BlueCollarGrit', '#Album_Cover_Master']
        : ['#Album_Cover_Master'],
      compatibleTracks: cleanId === 'TRK-01' || cleanId === 'TRK-03' || cleanId === 'TRK-04' || cleanId === 'TRK-24'
        ? ['TRK-01', 'TRK-03', 'TRK-04', 'TRK-24']
        : cleanId === 'TRK-07' || cleanId === 'TRK-09' || cleanId === 'TRK-13' || cleanId === 'TRK-14'
        ? ['TRK-07', 'TRK-09', 'TRK-13', 'TRK-14']
        : [cleanId],
    },
    {
      id: `${cleanId}-VIS-02`,
      trackId: cleanId,
      versionId: 'v1.0',
      assetType: 'Video_Seed_Frame',
      aspectRatio: '9:16',
      title: `${track.title} - Veo 3 Video Seed Keyframe`,
      prompt: `Vertical 9:16 cinematic video seed frame for ${track.title}, 60fps dynamic lighting, high contrast color grade`,
      isActiveMaster: false,
      webdavRelativePath: `Music-Production/${cleanId}/visuals/v1.0/${cleanId}_VeoSeed_${cleanTitle}_9x16.png`,
      fullWebdavUrl: `${PRODUCTION_NEXTCLOUD_WEBDAV}/${cleanId}/visuals/v1.0/${cleanId}_VeoSeed_${cleanTitle}_9x16.png`,
      similarityTags: ['#Video_Seed_Frame', '#Mobile_9_16'],
      compatibleTracks: [cleanId],
    },
    {
      id: `${cleanId}-VIS-03`,
      trackId: cleanId,
      versionId: 'v1.0',
      assetType: 'B_Roll_Cinematic_Plate',
      aspectRatio: '16:9',
      title: `${track.title} - 4K Cinematic Background Plate`,
      prompt: `Widescreen 16:9 cinematic storyboard plate for YouTube long-form release and stage ministry charts`,
      isActiveMaster: false,
      webdavRelativePath: `Music-Production/${cleanId}/visuals/v1.0/${cleanId}_CinematicPlate_${cleanTitle}_16x9.png`,
      fullWebdavUrl: `${PRODUCTION_NEXTCLOUD_WEBDAV}/${cleanId}/visuals/v1.0/${cleanId}_CinematicPlate_${cleanTitle}_16x9.png`,
      similarityTags: ['#B_Roll_Cinematic_Plate', '#Stage_Background'],
      compatibleTracks: [cleanId],
    },
  ];
}

// ==============================================================================
// 6. POSTGRESQL RELATIONAL MIGRATION SCRIPT GENERATOR
// ==============================================================================
export function generatePostgreSqlRelationalMigration(tracks: Track[]): string {
  const timestamp = new Date().toISOString();

  let sql = `-- ============================================================================
-- brickOS Sovereign Relational Music Production Schema & Complete Seed (PostgreSQL)
-- Generated automatically by brickOS Music Studio
-- Scanned & Synchronized: ${timestamp}
-- WebDAV Root: ${PRODUCTION_NEXTCLOUD_WEBDAV}
-- ============================================================================

BEGIN;

-- 1. Database Extensions & Custom Types
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
    CREATE TYPE project_status AS ENUM (
        'Idea / Concept',
        'Lyrics Finalized',
        'In Progress',
        'Suno Audio Gen',
        'UVR5 Stem Prep',
        'DAW Mix',
        'Audio Master',
        'Video Assets',
        'Sent for Distribution',
        'Released'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE stem_pass_type AS ENUM (
        'Primary_Vocal',
        'True_Instrumental',
        'Dry_Studio_Vocal',
        'DAW_Master_Session'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE visual_asset_type AS ENUM (
        'Album_Cover_Master',
        'Video_Seed_Frame',
        'Lyric_Video_Storyboard',
        'Social_Shorts_Thumbnail',
        'B_Roll_Cinematic_Plate'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. DDL: Table Definitions
CREATE TABLE IF NOT EXISTS ep_collections (
    id VARCHAR(16) PRIMARY KEY,
    title VARCHAR(128) NOT NULL,
    theme TEXT NOT NULL,
    target_release_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vocal_archetypes (
    name VARCHAR(64) PRIMARY KEY,
    archetype_title VARCHAR(128) NOT NULL,
    role VARCHAR(128) NOT NULL,
    formant_texture VARCHAR(128) NOT NULL,
    recommended_genres TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tracks (
    id VARCHAR(16) PRIMARY KEY,
    ep_id VARCHAR(16) REFERENCES ep_collections(id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    status project_status NOT NULL DEFAULT 'In Progress',
    genre VARCHAR(128) NOT NULL,
    bpm INTEGER NOT NULL CHECK (bpm > 40 AND bpm < 260),
    musical_key VARCHAR(32) NOT NULL,
    vocal_archetype VARCHAR(64) REFERENCES vocal_archetypes(name),
    theme_thesis TEXT NOT NULL,
    suno_style_prompt TEXT NOT NULL,
    suno_negative_prompt TEXT NOT NULL,
    lyrics TEXT,
    reference_track VARCHAR(255),
    target_lufs NUMERIC(4, 1) DEFAULT -12.0,
    target_true_peak NUMERIC(3, 1) DEFAULT -1.0,
    active_version VARCHAR(16) NOT NULL DEFAULT 'v1.0',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS track_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    track_id VARCHAR(16) NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    version_id VARCHAR(16) NOT NULL,
    commit_reason VARCHAR(255) NOT NULL,
    lyrics TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audio_stems (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    track_id VARCHAR(16) NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    pass_type stem_pass_type NOT NULL,
    model_used VARCHAR(128) NOT NULL,
    is_completed BOOLEAN NOT NULL DEFAULT TRUE,
    webdav_relative_path TEXT NOT NULL,
    file_size_bytes BIGINT,
    sample_rate_hz INTEGER DEFAULT 48000,
    bit_depth INTEGER DEFAULT 24,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS visual_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    track_id VARCHAR(16) NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    version_id VARCHAR(16) NOT NULL DEFAULT 'v1.0',
    asset_type visual_asset_type NOT NULL,
    aspect_ratio VARCHAR(8) NOT NULL DEFAULT '1:1',
    title VARCHAR(255) NOT NULL,
    prompt TEXT NOT NULL,
    is_active_master BOOLEAN NOT NULL DEFAULT FALSE,
    webdav_relative_path TEXT NOT NULL,
    file_size_bytes BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS interchangeable_asset_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    primary_track_id VARCHAR(16) REFERENCES tracks(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    asset_category VARCHAR(32) NOT NULL,
    asset_type VARCHAR(32) NOT NULL,
    theme_cluster VARCHAR(64) NOT NULL,
    webdav_relative_path TEXT NOT NULL,
    similarity_tags TEXT[] NOT NULL,
    compatible_tracks TEXT[] NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for lightning-fast queries
CREATE INDEX IF NOT EXISTS idx_tracks_ep ON tracks(ep_id);
CREATE INDEX IF NOT EXISTS idx_tracks_status ON tracks(status);
CREATE INDEX IF NOT EXISTS idx_audio_stems_track ON audio_stems(track_id);
CREATE INDEX IF NOT EXISTS idx_visual_assets_track ON visual_assets(track_id);
CREATE INDEX IF NOT EXISTS idx_interchangeable_theme ON interchangeable_asset_links(theme_cluster);

-- 3. SEED: Populate EP Collections
INSERT INTO ep_collections (id, title, theme) VALUES
  ('EP-01', 'EP 1: The Restoration Project', 'Refinement, Healing & Foundation'),
  ('EP-02', 'EP 2: The Conflict Suite', 'Family, Relationships & Sanctification'),
  ('EP-03', 'EP 3: War Room Anthems', 'Spiritual Warfare, Discipline & Identity'),
  ('EP-04', 'EP 4: The Surrender Sessions', 'Surrender, Sovereignty & Divine Presence')
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, theme = EXCLUDED.theme;

-- 4. SEED: Populate Official Vocal Archetypes
`;

  // Insert Vocal Archetypes
  OFFICIAL_VOCAL_ARCHETYPES.forEach((va) => {
    sql += `INSERT INTO vocal_archetypes (name, archetype_title, role, formant_texture, recommended_genres) VALUES
  ('${va.name}', '${va.archetypeTitle.replace(/'/g, "''")}', '${va.role.replace(/'/g, "''")}', '${va.formantTexture.replace(/'/g, "''")}', '${va.recommendedGenres.replace(/'/g, "''")}')
ON CONFLICT (name) DO UPDATE SET archetype_title = EXCLUDED.archetype_title, formant_texture = EXCLUDED.formant_texture;\n`;
  });

  sql += `\n-- 5. SEED: Populate 26 Master Tracks with Official Vocal Archetypes, BPM, Key & Theses\n`;

  // Insert Tracks
  tracks.forEach((t) => {
    const epNum = t.ep.includes('1') ? 'EP-01' : t.ep.includes('2') ? 'EP-02' : t.ep.includes('3') ? 'EP-03' : 'EP-04';
    const cleanTitle = t.title.replace(/'/g, "''");
    const cleanThesis = t.thesis.replace(/'/g, "''");
    const cleanGenre = t.genre.replace(/'/g, "''");
    const cleanSuno = t.sunoPrompt.replace(/'/g, "''");
    const cleanNeg = t.negativePrompt.replace(/'/g, "''");
    const cleanLyrics = (t.lyrics || '').replace(/'/g, "''");
    
    // Map to official vocal archetype name
    let vocalName = 'The Architect';
    if (t.vocal.toLowerCase().includes('brandon') || t.vocal.toLowerCase().includes('craftsman') || t.title.includes('Blueprint')) {
      vocalName = 'Brandon';
    } else if (t.vocal.toLowerCase().includes('ms t') || t.vocal.toLowerCase().includes('mrs t') || t.vocal.toLowerCase().includes('gospel choir')) {
      vocalName = 'Ms T';
    } else if (t.vocal.toLowerCase().includes('monica') || t.vocal.toLowerCase().includes('workout')) {
      vocalName = 'Monica';
    } else if (t.vocal.toLowerCase().includes('kane') || t.vocal.toLowerCase().includes('cynic')) {
      vocalName = 'Kane';
    } else if (t.vocal.toLowerCase().includes('patd')) {
      vocalName = 'PATD';
    } else if (t.vocal.toLowerCase().includes('silas') || t.vocal.toLowerCase().includes('inspector')) {
      vocalName = 'Silas Thorne';
    } else if (t.vocal.toLowerCase().includes('neon')) {
      vocalName = 'Neon Gospel';
    }

    sql += `INSERT INTO tracks (id, ep_id, title, status, genre, bpm, musical_key, vocal_archetype, theme_thesis, suno_style_prompt, suno_negative_prompt, lyrics) VALUES
  ('${t.id}', '${epNum}', '${cleanTitle}', 'In Progress', '${cleanGenre}', ${t.bpm}, '${t.key}', '${vocalName}', '${cleanThesis}', '${cleanSuno}', '${cleanNeg}', '${cleanLyrics}')
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, bpm = EXCLUDED.bpm, musical_key = EXCLUDED.musical_key, vocal_archetype = EXCLUDED.vocal_archetype, theme_thesis = EXCLUDED.theme_thesis;\n`;
  });

  sql += `\n-- 6. SEED: Populate 24-bit/48kHz Audio Stems with Live WebDAV URIs\n`;

  // Insert Audio Stems
  tracks.forEach((t) => {
    const stems = getTrackStems(t.id);
    stems.forEach((st) => {
      sql += `INSERT INTO audio_stems (track_id, pass_type, model_used, is_completed, webdav_relative_path, file_size_bytes, sample_rate_hz, bit_depth) VALUES
  ('${st.trackId}', '${st.passType}', '${st.modelUsed}', ${st.isCompleted}, '${st.fullWebdavUrl}', ${st.fileSizeBytes}, ${st.sampleRateHz}, ${st.bitDepth});\n`;
    });
  });

  sql += `\n-- 7. SEED: Populate Visual Assets with Live WebDAV URIs\n`;

  // Insert Visual Assets
  tracks.forEach((t) => {
    const visuals = getTrackVisualAssets(t);
    visuals.forEach((vis) => {
      const cleanPrompt = vis.prompt.replace(/'/g, "''");
      const cleanTitle = vis.title.replace(/'/g, "''");
      sql += `INSERT INTO visual_assets (track_id, version_id, asset_type, aspect_ratio, title, prompt, is_active_master, webdav_relative_path, file_size_bytes) VALUES
  ('${vis.trackId}', '${vis.versionId}', '${vis.assetType}', '${vis.aspectRatio}', '${cleanTitle}', '${cleanPrompt}', ${vis.isActiveMaster}, '${vis.fullWebdavUrl}', 4500000);\n`;
    });
  });

  sql += `\n-- 8. SEED: Populate Interchangeable Asset Similarity Matrix (#Theme_SanctuaryCross, #Theme_BlueCollarGrit, #CrossCatalog_BRoll, #Universal)\n`;

  // Insert Interchangeable Asset Links
  INTERCHANGEABLE_ASSET_MATRIX.forEach((sim) => {
    const cleanTitle = sim.title.replace(/'/g, "''");
    const cleanDesc = sim.description.replace(/'/g, "''");
    const primaryTrackSql = sim.primaryTrackId ? `'${sim.primaryTrackId}'` : 'NULL';
    const tagsSql = 'ARRAY[' + sim.similarityTags.map((tg) => `'${tg}'`).join(', ') + ']';
    const compatSql = 'ARRAY[' + sim.compatibleTracks.map((c) => `'${c}'`).join(', ') + ']';

    sql += `INSERT INTO interchangeable_asset_links (primary_track_id, title, asset_category, asset_type, theme_cluster, webdav_relative_path, similarity_tags, compatible_tracks, description) VALUES
  (${primaryTrackSql}, '${cleanTitle}', '${sim.assetCategory}', '${sim.assetType}', '${sim.themeCluster}', '${sim.fullWebdavUrl}', ${tagsSql}, ${compatSql}, '${cleanDesc}');\n`;
  });

  sql += `\nCOMMIT;\n\n-- Finished brickOS Relational Schema & Matrix Ingestion. Zero third-party cloud leakage.\n`;

  return sql;
}

// ==============================================================================
// 7. DAW & NETWORK INTEGRATION CODE GENERATORS
// ==============================================================================
export function generateCurlStemUploadCommand(trackId: string, stemName: string): string {
  const targetUrl = `${PRODUCTION_NEXTCLOUD_WEBDAV}/${trackId}/stems/${stemName}`;
  return `curl -u ${DEFAULT_WEBDAV_USER}:$WEBDAV_PASSWORD -T "${stemName}" "${targetUrl}"`;
}

export function generateRcloneConfigBlock(): string {
  return `[brickos_webdav]
type = webdav
url = ${PRODUCTION_NEXTCLOUD_WEBDAV}
vendor = nextcloud
user = ${DEFAULT_WEBDAV_USER}
# Run 'rclone config' or set RCLONE_CONFIG_BRICKOS_WEBDAV_PASS to authenticate`;
}

export function generateRcloneSyncCommand(trackId?: string): string {
  if (trackId) {
    return `rclone sync "./${trackId}/stems/" "brickos_webdav:${trackId}/stems/" --progress --transfers 4 --checkers 8`;
  }
  return `rclone sync "./stems/" "brickos_webdav:stems/" --progress --transfers 4 --checkers 8`;
}

export function generateWindowsDriveMountCommand(): string {
  return `net use Z: ${PRODUCTION_NEXTCLOUD_WEBDAV} /user:${DEFAULT_WEBDAV_USER} * /persistent:yes`;
}
