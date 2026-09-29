import { NextcloudFolderAsset, NextcloudAssetCategory, NextcloudSyncConfig, Track } from '../types';
import { ECV_CANONICAL_ASSETS, getTrackNextcloudAssets, matchNextcloudFilenameToTrack } from './nextcloudAssetIndex';

export { ECV_CANONICAL_ASSETS, getTrackNextcloudAssets, matchNextcloudFilenameToTrack };

export const DEFAULT_NEXTCLOUD_CONFIG: NextcloudSyncConfig = {
  serverUrl: 'https://nextcloud.moyercloud.com',
  username: 'ncted',
  webdavRoot: 'https://nextcloud.moyercloud.com/remote.php/dav/files/ncted/Music-Production',
  folderIdOrShareUrl: 'https://nextcloud.moyercloud.com/index.php/apps/files/files/207332?dir=/Music-Production',
  lastConnectionStatus: 'idle',
};

export const INITIAL_FOLDER_207332_ASSETS: NextcloudFolderAsset[] = [
  {
    id: 'NC-207332-01',
    filename: 'TRK-01_The_Masters_Hand_Master_WAV2448.wav',
    folderId: '207332',
    category: 'MASTER_AUDIO',
    fileSizeBytes: 50541312,
    fileSizeFormatted: '48.2 MB',
    mimeType: 'audio/wav',
    webdavPath: '/remote.php/dav/files/ncted/Music-Production/TRK-01/stems/TRK-01_The_Masters_Hand_Master_WAV2448.wav',
    shareUrl: 'https://nextcloud.moyercloud.com/index.php/f/207332',
    matchedTrackId: 'TRK-01',
    matchedTrackTitle: "The Master's Hand",
    matchConfidence: 100,
    suggestedTrackId: 'TRK-01',
    suggestedCategory: 'MASTER_AUDIO',
    isMatched: true,
    bpm: 78,
    key: 'C Major',
    audioDurationSeconds: 215,
    previewAudioType: 'instrumental',
    notes: '24-bit/48kHz Master Stereo Print. Nashville LUFS -14.1 verified.',
    lastSyncedAt: '2026-09-24T20:30:00Z',
  },
  {
    id: 'NC-207332-02',
    filename: 'TRK-01_Lead_Vocal_UVR5_Clean_BS-Roformer.wav',
    folderId: '207332',
    category: 'UVR5_VOCAL_STEM',
    fileSizeBytes: 25270656,
    fileSizeFormatted: '24.1 MB',
    mimeType: 'audio/wav',
    webdavPath: '/remote.php/dav/files/ncted/Music-Production/TRK-01/stems/TRK-01_Lead_Vocal_UVR5_Clean_BS-Roformer.wav',
    shareUrl: 'https://nextcloud.moyercloud.com/index.php/f/207332',
    matchedTrackId: 'TRK-01',
    matchedTrackTitle: "The Master's Hand",
    matchConfidence: 98,
    suggestedTrackId: 'TRK-01',
    suggestedCategory: 'UVR5_VOCAL_STEM',
    isMatched: true,
    bpm: 78,
    key: 'C Major',
    audioDurationSeconds: 215,
    previewAudioType: 'vocal',
    notes: 'Isolated Lead Vocal (The Architect). High dynamic range, zero bleed.',
    lastSyncedAt: '2026-09-24T20:30:00Z',
  },
  {
    id: 'NC-207332-03',
    filename: 'The_Masters_Hand_Acoustic_Guitar_Bed_Nashville.wav',
    folderId: '207332',
    category: 'INSTRUMENTAL_STEM',
    fileSizeBytes: 32505856,
    fileSizeFormatted: '31.0 MB',
    mimeType: 'audio/wav',
    webdavPath: '/remote.php/dav/files/ncted/Music-Production/TRK-01/stems/The_Masters_Hand_Acoustic_Guitar_Bed_Nashville.wav',
    shareUrl: 'https://nextcloud.moyercloud.com/index.php/f/207332',
    matchedTrackId: 'TRK-01',
    matchedTrackTitle: "The Master's Hand",
    matchConfidence: 92,
    suggestedTrackId: 'TRK-01',
    suggestedCategory: 'INSTRUMENTAL_STEM',
    isMatched: true,
    bpm: 78,
    key: 'C Major',
    audioDurationSeconds: 215,
    previewAudioType: 'instrumental',
    notes: 'Acoustic Martin D-28 fingerpicked groove. Natural wood body bloom.',
    lastSyncedAt: '2026-09-24T20:30:00Z',
  },
  {
    id: 'NC-207332-04',
    filename: 'TRK-01_Cover_Art_Cedar_Woodshop_4k_1x1.png',
    folderId: '207332',
    category: 'VISUAL_ARTWORK',
    fileSizeBytes: 6501171,
    fileSizeFormatted: '6.2 MB',
    mimeType: 'image/png',
    webdavPath: '/remote.php/dav/files/ncted/Music-Production/TRK-01/visuals/v1.0/TRK-01_Cover_Art_Cedar_Woodshop_4k_1x1.png',
    shareUrl: 'https://nextcloud.moyercloud.com/index.php/f/207332',
    matchedTrackId: 'TRK-01',
    matchedTrackTitle: "The Master's Hand",
    matchConfidence: 100,
    suggestedTrackId: 'TRK-01',
    suggestedCategory: 'VISUAL_ARTWORK',
    isMatched: true,
    previewImageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
    notes: '3840x3840 1:1 Album Art. Weathered cedar woodshop with golden Kintsugi seams.',
    lastSyncedAt: '2026-09-24T20:30:00Z',
  },
  {
    id: 'NC-207332-05',
    filename: 'Crucible_RoughMix_Take2_BPM88_Dm.wav',
    folderId: '207332',
    category: 'UNCATEGORIZED',
    fileSizeBytes: 44040192,
    fileSizeFormatted: '42.0 MB',
    mimeType: 'audio/wav',
    webdavPath: '/remote.php/dav/files/ncted/Music-Production/raw_ingest/Crucible_RoughMix_Take2_BPM88_Dm.wav',
    shareUrl: 'https://nextcloud.moyercloud.com/index.php/f/207332',
    matchedTrackId: null,
    matchConfidence: 88,
    suggestedTrackId: 'TRK-07',
    suggestedCategory: 'MASTER_AUDIO',
    isMatched: false,
    bpm: 88,
    key: 'D Minor',
    previewAudioType: 'instrumental',
    notes: 'Contains title token "Crucible", BPM 88, D Minor. Ready to match to TRK-07.',
    lastSyncedAt: '2026-09-24T20:30:00Z',
  },
  {
    id: 'NC-207332-06',
    filename: 'Iron_And_Altar_Master_24bit_48k.wav',
    folderId: '207332',
    category: 'UNCATEGORIZED',
    fileSizeBytes: 54945792,
    fileSizeFormatted: '52.4 MB',
    mimeType: 'audio/wav',
    webdavPath: '/remote.php/dav/files/ncted/Music-Production/raw_ingest/Iron_And_Altar_Master_24bit_48k.wav',
    shareUrl: 'https://nextcloud.moyercloud.com/index.php/f/207332',
    matchedTrackId: null,
    matchConfidence: 95,
    suggestedTrackId: 'TRK-14',
    suggestedCategory: 'MASTER_AUDIO',
    isMatched: false,
    bpm: 84,
    key: 'A Minor',
    previewAudioType: 'instrumental',
    notes: 'Matches title "Iron & Altar". Heavy percussion and resonant anvil strikes.',
    lastSyncedAt: '2026-09-24T20:30:00Z',
  },
  {
    id: 'NC-207332-07',
    filename: 'Meet_Me_Here_5AM_Rain_Diesel_Cab_Reel_9x16.mp4',
    folderId: '207332',
    category: 'VIDEO_REEL',
    fileSizeBytes: 19293798,
    fileSizeFormatted: '18.4 MB',
    mimeType: 'video/mp4',
    webdavPath: '/remote.php/dav/files/ncted/Music-Production/TRK-13/visuals/v1.0/Meet_Me_Here_5AM_Rain_Diesel_Cab_Reel_9x16.mp4',
    shareUrl: 'https://nextcloud.moyercloud.com/index.php/f/207332',
    matchedTrackId: 'TRK-13',
    matchedTrackTitle: 'Meet Me Here',
    matchConfidence: 96,
    suggestedTrackId: 'TRK-13',
    suggestedCategory: 'VIDEO_REEL',
    isMatched: true,
    previewImageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80',
    notes: '9:16 Vertical Video Reel. Truck cab in freezing rain at 5 AM, amber dash glow.',
    lastSyncedAt: '2026-09-24T20:30:00Z',
  },
  ...ECV_CANONICAL_ASSETS,
  {
    id: 'NC-207332-09',
    filename: 'Resurrection_Dawn_Ruach_Vocal_Choir_Stem.wav',
    folderId: '207332',
    category: 'UNCATEGORIZED',
    fileSizeBytes: 35861299,
    fileSizeFormatted: '34.2 MB',
    mimeType: 'audio/wav',
    webdavPath: '/remote.php/dav/files/ncted/Music-Production/raw_ingest/Resurrection_Dawn_Ruach_Vocal_Choir_Stem.wav',
    shareUrl: 'https://nextcloud.moyercloud.com/index.php/f/207332',
    matchedTrackId: null,
    matchConfidence: 94,
    suggestedTrackId: 'TRK-21',
    suggestedCategory: 'UVR5_VOCAL_STEM',
    isMatched: false,
    bpm: 74,
    key: 'E Major',
    previewAudioType: 'vocal',
    notes: 'Matches title "Resurrection Dawn". Full Ms T choir crescendo.',
    lastSyncedAt: '2026-09-24T20:30:00Z',
  },
  {
    id: 'NC-207332-10',
    filename: 'Nashville_SOP_Rules_v1_9_Production_Rulebook.md',
    folderId: '207332',
    category: 'LYRIC_SOP_DOC',
    fileSizeBytes: 15360,
    fileSizeFormatted: '15.0 KB',
    mimeType: 'text/markdown',
    webdavPath: '/remote.php/dav/files/ncted/Music-Production/sop_rules/Nashville_SOP_Rules_v1_9_Production_Rulebook.md',
    shareUrl: 'https://nextcloud.moyercloud.com/index.php/f/207332',
    matchedTrackId: null,
    matchConfidence: 100,
    suggestedCategory: 'LYRIC_SOP_DOC',
    isMatched: true,
    notes: 'Global Sovereign SOP Rulebook: OBI Funnel, Christianese Blacklist, Throne Room Pivot.',
    lastSyncedAt: '2026-09-24T20:30:00Z',
  },
  {
    id: 'NC-207332-11',
    filename: 'Silas_Thorne_Outlaw_Gospel_Acoustic_Resonator.wav',
    folderId: '207332',
    category: 'UNCATEGORIZED',
    fileSizeBytes: 22649241,
    fileSizeFormatted: '21.6 MB',
    mimeType: 'audio/wav',
    webdavPath: '/remote.php/dav/files/ncted/Music-Production/raw_ingest/Silas_Thorne_Outlaw_Gospel_Acoustic_Resonator.wav',
    shareUrl: 'https://nextcloud.moyercloud.com/index.php/f/207332',
    matchedTrackId: null,
    matchConfidence: 84,
    suggestedTrackId: 'TRK-08',
    suggestedCategory: 'INSTRUMENTAL_STEM',
    isMatched: false,
    bpm: 92,
    key: 'G Minor',
    previewAudioType: 'instrumental',
    notes: 'Slide resonator acoustic guitar with weathered smoke bite for Silas Thorne track.',
    lastSyncedAt: '2026-09-24T20:30:00Z',
  },
  {
    id: 'NC-207332-12',
    filename: 'TRK-06_The_Potters_Wheel_Heavy_808_Drop.wav',
    folderId: '207332',
    category: 'INSTRUMENTAL_STEM',
    fileSizeBytes: 14889779,
    fileSizeFormatted: '14.2 MB',
    mimeType: 'audio/wav',
    webdavPath: '/remote.php/dav/files/ncted/Music-Production/TRK-06/stems/TRK-06_The_Potters_Wheel_Heavy_808_Drop.wav',
    shareUrl: 'https://nextcloud.moyercloud.com/index.php/f/207332',
    matchedTrackId: 'TRK-06',
    matchedTrackTitle: "The Potter's Wheel",
    matchConfidence: 100,
    suggestedTrackId: 'TRK-06',
    suggestedCategory: 'INSTRUMENTAL_STEM',
    isMatched: true,
    bpm: 140,
    key: 'F Minor',
    previewAudioType: 'drums',
    notes: 'Sub-bass 808 glide tuned to F1, compressed for mobile phone headphone impact.',
    lastSyncedAt: '2026-09-24T20:30:00Z',
  },
  {
    id: 'NC-207332-13',
    filename: 'Gethsemane_Sweat_Lead_Vocal_Dry_UVR5.wav',
    folderId: '207332',
    category: 'UNCATEGORIZED',
    fileSizeBytes: 25060966,
    fileSizeFormatted: '23.9 MB',
    mimeType: 'audio/wav',
    webdavPath: '/remote.php/dav/files/ncted/Music-Production/raw_ingest/Gethsemane_Sweat_Lead_Vocal_Dry_UVR5.wav',
    shareUrl: 'https://nextcloud.moyercloud.com/index.php/f/207332',
    matchedTrackId: null,
    matchConfidence: 96,
    suggestedTrackId: 'TRK-16',
    suggestedCategory: 'UVR5_VOCAL_STEM',
    isMatched: false,
    bpm: 76,
    key: 'B Minor',
    previewAudioType: 'vocal',
    notes: 'Raw breathing, throat rattle, high spiritual vulnerability. Matches TRK-16.',
    lastSyncedAt: '2026-09-24T20:30:00Z',
  },
  {
    id: 'NC-207332-14',
    filename: 'Breath_And_Bone_Ruach_Sanctuary_Loop_9x16.mp4',
    folderId: '207332',
    category: 'VIDEO_REEL',
    fileSizeBytes: 23173529,
    fileSizeFormatted: '22.1 MB',
    mimeType: 'video/mp4',
    webdavPath: '/remote.php/dav/files/ncted/Music-Production/TRK-24/visuals/v1.0/Breath_And_Bone_Ruach_Sanctuary_Loop_9x16.mp4',
    shareUrl: 'https://nextcloud.moyercloud.com/index.php/f/207332',
    matchedTrackId: 'TRK-24',
    matchedTrackTitle: 'Breath and Bone',
    matchConfidence: 98,
    suggestedTrackId: 'TRK-24',
    suggestedCategory: 'VIDEO_REEL',
    isMatched: true,
    previewImageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
    notes: '9:16 Veo 3 Video. Swirling golden vortex in ancient stone cathedral.',
    lastSyncedAt: '2026-09-24T20:30:00Z',
  },
  {
    id: 'NC-207332-15',
    filename: 'Acoustic_Heartland_Nashville_Number_System_Charts.pdf',
    folderId: '207332',
    category: 'CHORD_MIDI',
    fileSizeBytes: 1258291,
    fileSizeFormatted: '1.2 MB',
    mimeType: 'application/pdf',
    webdavPath: '/remote.php/dav/files/ncted/Music-Production/shared/charts/Acoustic_Heartland_Nashville_Number_System_Charts.pdf',
    shareUrl: 'https://nextcloud.moyercloud.com/index.php/f/207332',
    matchedTrackId: null,
    matchConfidence: 80,
    suggestedTrackId: 'TRK-01',
    suggestedCategory: 'CHORD_MIDI',
    isMatched: false,
    notes: 'Full Nashville Number System chord charts for acoustic guitar and piano players.',
    lastSyncedAt: '2026-09-24T20:30:00Z',
  },
  {
    id: 'NC-207332-16',
    filename: 'Living_Water_In_The_Quarry_Acoustic_Folk_Bed.wav',
    folderId: '207332',
    category: 'UNCATEGORIZED',
    fileSizeBytes: 27367833,
    fileSizeFormatted: '26.1 MB',
    mimeType: 'audio/wav',
    webdavPath: '/remote.php/dav/files/ncted/Music-Production/raw_ingest/Living_Water_In_The_Quarry_Acoustic_Folk_Bed.wav',
    shareUrl: 'https://nextcloud.moyercloud.com/index.php/f/207332',
    matchedTrackId: null,
    matchConfidence: 94,
    suggestedTrackId: 'TRK-12',
    suggestedCategory: 'INSTRUMENTAL_STEM',
    isMatched: false,
    bpm: 96,
    key: 'D Major',
    previewAudioType: 'instrumental',
    notes: 'Limestone quarry echo with acoustic guitar and foot stomps. Matches TRK-12.',
    lastSyncedAt: '2026-09-24T20:30:00Z',
  },
  {
    id: 'NC-207332-17',
    filename: 'TRK-04_Cross_Timber_Horizon_1x1.png',
    folderId: '207332',
    category: 'VISUAL_ARTWORK',
    fileSizeBytes: 5033164,
    fileSizeFormatted: '4.8 MB',
    mimeType: 'image/png',
    webdavPath: '/remote.php/dav/files/ncted/Music-Production/TRK-04/visuals/v1.0/TRK-04_Cross_Timber_Horizon_1x1.png',
    shareUrl: 'https://nextcloud.moyercloud.com/index.php/f/207332',
    matchedTrackId: 'TRK-04',
    matchedTrackTitle: 'Cornerstone',
    matchConfidence: 98,
    suggestedTrackId: 'TRK-04',
    suggestedCategory: 'VISUAL_ARTWORK',
    isMatched: true,
    previewImageUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80',
    notes: 'Weathered cedar timber against morning red dawn sky. 1:1 Album Artwork.',
    lastSyncedAt: '2026-09-24T20:30:00Z',
  },
  {
    id: 'NC-207332-18',
    filename: 'Uncategorized_Field_Tape_Prayer_Intro_30s.wav',
    folderId: '207332',
    category: 'UNCATEGORIZED',
    fileSizeBytes: 8388608,
    fileSizeFormatted: '8.0 MB',
    mimeType: 'audio/wav',
    webdavPath: '/remote.php/dav/files/ncted/Music-Production/raw_ingest/Uncategorized_Field_Tape_Prayer_Intro_30s.wav',
    shareUrl: 'https://nextcloud.moyercloud.com/index.php/f/207332',
    matchedTrackId: null,
    matchConfidence: 45,
    suggestedCategory: 'UVR5_VOCAL_STEM',
    isMatched: false,
    bpm: 70,
    previewAudioType: 'vocal',
    notes: 'Low-fi cassette field recording of blue-collar morning prayer.',
    lastSyncedAt: '2026-09-24T20:30:00Z',
  }
];

const LOCAL_STORAGE_NC_ASSETS_KEY = 'brickos_nextcloud_folder_207332_assets';
const LOCAL_STORAGE_NC_CONFIG_KEY = 'brickos_nextcloud_sync_config';

/**
 * Smart Auto-Match Algorithm
 * Compares an asset filename against all catalog tracks and detects best match + confidence
 */
export function autoMatchAssetToCatalog(
  filename: string,
  catalog: Track[]
): {
  matchedTrackId: string | null;
  confidence: number;
  detectedCategory: NextcloudAssetCategory;
  detectedBpm?: number;
} {
  const clean = filename.toLowerCase().replace(/[-_.]/g, ' ');

  // 1. Detect category from filename extension and keywords
  let detectedCategory: NextcloudAssetCategory = 'UNCATEGORIZED';
  if (filename.endsWith('.png') || filename.endsWith('.jpg') || filename.endsWith('.webp')) {
    detectedCategory = 'VISUAL_ARTWORK';
  } else if (filename.endsWith('.mp4') || filename.endsWith('.mov')) {
    detectedCategory = 'VIDEO_REEL';
  } else if (filename.endsWith('.md') || filename.endsWith('.txt')) {
    detectedCategory = 'LYRIC_SOP_DOC';
  } else if (filename.endsWith('.pdf') || filename.endsWith('.mid') || filename.endsWith('.midi')) {
    detectedCategory = 'CHORD_MIDI';
  } else if (filename.endsWith('.wav') || filename.endsWith('.mp3') || filename.endsWith('.flac')) {
    if (clean.includes('vocal') || clean.includes('acapella') || clean.includes('choir') || clean.includes('uvr5')) {
      detectedCategory = 'UVR5_VOCAL_STEM';
    } else if (clean.includes('master') || clean.includes('final mix') || clean.includes('roughmix')) {
      detectedCategory = 'MASTER_AUDIO';
    } else {
      detectedCategory = 'INSTRUMENTAL_STEM';
    }
  }

  // 2. Detect BPM if present (e.g. BPM88 or 88bpm)
  const bpmMatch = clean.match(/\b(?:bpm\s*(\d{2,3})|(\d{2,3})\s*bpm)\b/);
  const detectedBpm = bpmMatch ? parseInt(bpmMatch[1] || bpmMatch[2], 10) : undefined;

  // 3. Check for explicit TRK-XX token
  const trkIdMatch = filename.match(/TRK[-_]?(\d{1,2})/i);
  if (trkIdMatch) {
    const paddedNum = trkIdMatch[1].padStart(2, '0');
    const directTrack = catalog.find(t => t.id === `TRK-${paddedNum}`);
    if (directTrack) {
      return {
        matchedTrackId: directTrack.id,
        confidence: 100,
        detectedCategory,
        detectedBpm: detectedBpm || directTrack.bpm,
      };
    }
  }

  // 4. Fuzzy token matching against track titles and EPs
  let bestTrack: Track | null = null;
  let bestScore = 0;

  for (const track of catalog) {
    const titleTokens = track.title.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    let tokenMatches = 0;

    for (const token of titleTokens) {
      if (clean.includes(token)) {
        tokenMatches += 1;
      }
    }

    if (tokenMatches > 0) {
      const matchRatio = tokenMatches / titleTokens.length;
      let score = Math.round(matchRatio * 85);

      // Boost if EP name matches
      const epTokens = track.ep.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      if (epTokens.some(e => clean.includes(e))) {
        score += 10;
      }

      // Boost if detected BPM matches track BPM within 2 BPM
      if (detectedBpm && Math.abs(detectedBpm - track.bpm) <= 2) {
        score += 5;
      }

      if (score > bestScore) {
        bestScore = score;
        bestTrack = track;
      }
    }
  }

  if (bestTrack && bestScore >= 50) {
    return {
      matchedTrackId: bestTrack.id,
      confidence: Math.min(bestScore, 98),
      detectedCategory,
      detectedBpm,
    };
  }

  return {
    matchedTrackId: null,
    confidence: 0,
    detectedCategory,
    detectedBpm,
  };
}

/**
 * Load Nextcloud Assets from browser storage or return defaults
 */
export function getSavedNextcloudAssets(catalog: Track[]): NextcloudFolderAsset[] {
  if (typeof window === 'undefined') return INITIAL_FOLDER_207332_ASSETS;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_NC_ASSETS_KEY);
    if (raw) {
      const parsed: NextcloudFolderAsset[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure all loaded paths point to the sovereign /Music-Production directory
        return parsed.map(asset => ({
          ...asset,
          folderId: '207332',
          webdavPath: (asset.webdavPath || '').replace('/brickOS/', '/Music-Production/'),
          shareUrl: 'https://nextcloud.moyercloud.com/index.php/apps/files/files/207332?dir=/Music-Production'
        }));
      }
    }
  } catch (err) {
    console.warn('Failed to parse cached Nextcloud assets:', err);
  }
  return INITIAL_FOLDER_207332_ASSETS;
}

/**
 * Save Nextcloud Assets to browser storage
 */
export function saveNextcloudAssets(assets: NextcloudFolderAsset[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_NC_ASSETS_KEY, JSON.stringify(assets));
  } catch (err) {
    console.warn('Failed to persist Nextcloud assets:', err);
  }
}

/**
 * Load Nextcloud Config from storage
 */
export function getSavedNextcloudConfig(): NextcloudSyncConfig {
  if (typeof window === 'undefined') return DEFAULT_NEXTCLOUD_CONFIG;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_NC_CONFIG_KEY);
    if (raw) {
      return { ...DEFAULT_NEXTCLOUD_CONFIG, ...JSON.parse(raw) };
    }
  } catch {
    // fallback
  }
  return DEFAULT_NEXTCLOUD_CONFIG;
}

/**
 * Save Nextcloud Config to storage
 */
export function saveNextcloudConfig(cfg: NextcloudSyncConfig): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_NC_CONFIG_KEY, JSON.stringify(cfg));
  } catch {
    // ignore
  }
}
