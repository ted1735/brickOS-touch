import { NextcloudFolderAsset, NextcloudAssetCategory, NextcloudSyncConfig, Track } from '../types';
import { ALL_CANONICAL_NEXTCLOUD_ASSETS, ECV_CANONICAL_ASSETS, getTrackNextcloudAssets, matchNextcloudFilenameToTrack, NEXTCLOUD_SHARE_ROOT } from './nextcloudAssetIndex';
import {
  DEFAULT_NEXTCLOUD_CONFIG,
  LOCAL_STORAGE_NC_CONFIG_KEY,
  getSavedNextcloudConfig,
  saveNextcloudConfig,
  buildNextcloudStreamUrl,
} from '../utils/nextcloudStream';

export {
  ALL_CANONICAL_NEXTCLOUD_ASSETS,
  ECV_CANONICAL_ASSETS,
  getTrackNextcloudAssets,
  matchNextcloudFilenameToTrack,
  DEFAULT_NEXTCLOUD_CONFIG,
  getSavedNextcloudConfig,
  saveNextcloudConfig,
  buildNextcloudStreamUrl,
};

export const INITIAL_FOLDER_207332_ASSETS: NextcloudFolderAsset[] = [
  ...(ALL_CANONICAL_NEXTCLOUD_ASSETS || []),
  {
    id: 'NC-207332-SOP-GLOBAL',
    filename: 'Nashville_SOP_Rules_v1_9_Production_Rulebook.md',
    folderId: '207332',
    category: 'LYRIC_SOP_DOC',
    fileSizeBytes: 15360,
    fileSizeFormatted: '15.0 KB',
    mimeType: 'text/markdown',
    webdavPath: '/remote.php/dav/files/ncted/Music-Production/docs/Nashville_SOP_Rules_v1_9_Production_Rulebook.md',
    shareUrl: NEXTCLOUD_SHARE_ROOT,
    matchedTrackId: undefined,
    matchConfidence: 100,
    suggestedCategory: 'LYRIC_SOP_DOC',
    isMatched: true,
    notes: 'Global Sovereign SOP Rulebook: OBI Funnel, Christianese Blacklist, Throne Room Pivot, Master Audio 24/48 standard.',
    lastSyncedAt: new Date().toISOString(),
    tags: ['Global', 'SOP Rules', 'Rulebook', 'Nashville']
  }
];

const LOCAL_STORAGE_NC_ASSETS_KEY = 'brickos_nextcloud_folder_207332_assets';

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
        // Build combined map seeded with INITIAL_FOLDER_207332_ASSETS
        const assetMap = new Map<string, NextcloudFolderAsset>();
        INITIAL_FOLDER_207332_ASSETS.forEach(a => assetMap.set(a.filename, a));

        parsed.forEach(asset => {
          assetMap.set(asset.filename, {
            ...asset,
            folderId: '207332',
            webdavPath: (asset.webdavPath || '').replace('/brickOS/', '/Music-Production/'),
            shareUrl: NEXTCLOUD_SHARE_ROOT
          });
        });

        return Array.from(assetMap.values());
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


