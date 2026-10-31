import { Track, TrackStatus, SunoTrackAssets, SunoAudioTake, LyricAudioSnippet, SunoVideoMaster, EngineSliders } from '../types';

export interface RawAssetItem {
  name: string;
  path: string;
  href?: string;
  size: number;
  mimeType: string;
  lastModified?: string;
}

export interface InferredAudioSpecs {
  format: 'wav' | 'mp3' | 'flac';
  sampleRate: number;
  bitDepth: number;
  channels: number;
  lufsIntegrated?: number;
  lra?: number;
  truePeakDb?: number;
  spectralEnhancements?: {
    ultrasonicHissReductionDb: number;
    presenceSmoothingDb: number;
    subBassWarmthDb: number;
    lowEndWarmthDb: number;
  };
}

export interface TrackMetadataMappingResult {
  trackId: string;
  trackTitle: string;
  status: TrackStatus;
  bpm?: number;
  key?: string;
  camelotKey?: string;
  vocal?: string;
  vocalCast?: string;
  sunoAssets: SunoTrackAssets;
  newStatusReason: string;
  identifiedTakesCount: number;
  identifiedSnippetsCount: number;
  identifiedVideosCount: number;
}

// Canonical Camelot Key Matrix
const MUSICAL_KEY_TO_CAMELOT: Record<string, string> = {
  'Ab Minor': '1A', 'B Major': '1B',
  'Eb Minor': '2A', 'F# Major': '2B', 'Gb Major': '2B',
  'Bb Minor': '3A', 'Db Major': '3B', 'C# Major': '3B',
  'F Minor': '4A', 'Ab Major': '4B',
  'C Minor': '5A', 'Eb Major': '5B',
  'G Minor': '6A', 'Bb Major': '6B',
  'D Minor': '7A', 'F Major': '7B',
  'A Minor': '8A', 'C Major': '8B',
  'E Minor': '9A', 'G Major': '9B',
  'B Minor': '10A', 'D Major': '10B',
  'F# Minor': '11A', 'A Major': '11B',
  'C# Minor': '12A', 'E Major': '12B',
};

// Known mastering benchmarks for verified Suno neural masters
const KNOWN_MASTERING_BENCHMARKS: Record<string, Partial<InferredAudioSpecs>> = {
  'manic': {
    format: 'wav',
    sampleRate: 48000,
    bitDepth: 24,
    channels: 2,
    lufsIntegrated: -16.1,
    lra: 9.3,
    truePeakDb: -0.5,
    spectralEnhancements: {
      ultrasonicHissReductionDb: -8.90,
      presenceSmoothingDb: -1.58,
      subBassWarmthDb: 0.46,
      lowEndWarmthDb: 0.38,
    },
  },
  'meet me here': {
    format: 'wav',
    sampleRate: 48000,
    bitDepth: 24,
    channels: 2,
    lufsIntegrated: -14.2,
    lra: 8.5,
    truePeakDb: -0.3,
  },
  'brick by brick': {
    format: 'flac',
    sampleRate: 48000,
    bitDepth: 24,
    channels: 2,
    lufsIntegrated: -13.8,
    lra: 7.9,
    truePeakDb: -0.2,
  },
  'every candle': {
    format: 'mp3',
    sampleRate: 44100,
    bitDepth: 16,
    channels: 2,
    lufsIntegrated: -14.5,
    lra: 8.2,
    truePeakDb: -0.4,
  },
};

/**
 * Infers technical audio specifications from filename and known benchmarks
 */
export function inferAudioSpecs(filename: string, songContext: string): InferredAudioSpecs {
  const lower = filename.toLowerCase();
  const lowerCtx = songContext.toLowerCase();

  let format: 'wav' | 'mp3' | 'flac' = 'wav';
  if (lower.endsWith('.mp3')) format = 'mp3';
  else if (lower.endsWith('.flac')) format = 'flac';

  // Check known mastering benchmarks
  for (const [key, benchmark] of Object.entries(KNOWN_MASTERING_BENCHMARKS)) {
    if (lower.includes(key) || lowerCtx.includes(key)) {
      return {
        format: benchmark.format || format,
        sampleRate: benchmark.sampleRate || (format === 'wav' ? 48000 : 44100),
        bitDepth: benchmark.bitDepth || (format === 'wav' ? 24 : 16),
        channels: benchmark.channels || 2,
        lufsIntegrated: benchmark.lufsIntegrated ?? (format === 'wav' ? -16.0 : -14.0),
        lra: benchmark.lra ?? 8.5,
        truePeakDb: benchmark.truePeakDb ?? -0.5,
        spectralEnhancements: benchmark.spectralEnhancements,
      };
    }
  }

  // Standard high-fidelity default
  return {
    format,
    sampleRate: format === 'wav' ? 48000 : 44100,
    bitDepth: format === 'wav' ? 24 : 16,
    channels: 2,
    lufsIntegrated: format === 'wav' ? -16.0 : -14.0,
    lra: 8.5,
    truePeakDb: -0.5,
  };
}

/**
 * Parses timestamp boundaries from snippet filenames like "snip_15_26.wav" or "chorus1_140_155.wav"
 */
export function parseSnippetTimestamps(filename: string): { startSec: number; endSec: number; role: string } {
  const clean = filename.replace(/\.[^/.]+$/, '');
  const lower = clean.toLowerCase();

  // Pattern: snip_15_26 or chorus1_140_155 or bridge_full_205_260
  const matchRange = lower.match(/(\d+)_(\d+)/);
  if (matchRange) {
    const startSec = parseInt(matchRange[1], 10);
    const endSec = parseInt(matchRange[2], 10);
    let role = 'Section Snippet';
    if (lower.includes('chorus')) role = 'Chorus';
    else if (lower.includes('verse')) role = 'Verse';
    else if (lower.includes('bridge')) role = 'Bridge';
    else if (lower.includes('scream')) role = 'Cold Stop Scream';
    else if (lower.includes('microwave')) role = 'Verse 2 Hook';
    return { startSec, endSec, role };
  }

  // Single second offset: prayers_drywall_52s.wav
  const matchSingle = lower.match(/(\d+)s/);
  if (matchSingle) {
    const startSec = parseInt(matchSingle[1], 10);
    return { startSec, endSec: startSec + 15, role: 'Lyrical Milestone' };
  }

  return { startSec: 0, endSec: 25, role: 'General Snippet' };
}

/**
 * Maps a list of raw Nextcloud assets belonging to a track folder to structured musical metadata
 */
export function mapTrackFolderAssets(
  track: Track,
  folderAssets: RawAssetItem[],
  folderName: string
): TrackMetadataMappingResult {
  const takes: SunoAudioTake[] = [];
  const snippets: LyricAudioSnippet[] = [];
  const videoMasters: SunoVideoMaster[] = [];

  let highestStatus: TrackStatus = track.status || 'Idea / Concept';
  let statusReason = 'Retained existing status';

  for (const asset of folderAssets) {
    const name = asset.name || (asset.path ? asset.path.split('/').filter(Boolean).pop() : '') || '';
    if (!name) continue;
    const lower = name.toLowerCase();
    const assetPath = asset.path || asset.href || '';
    const cleanWebdav = assetPath.startsWith('/') ? assetPath : '/' + assetPath;
    const streamUrl = `/api/nextcloud/stream?path=${encodeURIComponent(cleanWebdav)}`;

    // 1. Audio Assets
    if (lower.endsWith('.wav') || lower.endsWith('.mp3') || lower.endsWith('.flac')) {
      const isRemaster = lower.includes('remaster');
      const isMasterCandidate = lower.includes('master') || lower.includes('bmv1') || lower.startsWith('7.5s');
      const isSnippet = lower.startsWith('snip_') || lower.includes('_snip_') || lower.includes('_drywall') || lower.includes('scream_') || lower.includes('chorus1_') || lower.includes('bridge_full_');

      if (isSnippet) {
        const { startSec, endSec, role } = parseSnippetTimestamps(name);
        snippets.push({
          id: `snip-${snippets.length + 1}-${cleanWebdav.replace(/[^a-zA-Z0-9]/g, '_')}`,
          label: `${role} (${startSec}s–${endSec}s)`,
          lyricSection: role,
          lyricQuote: name,
          startTimeSeconds: startSec,
          endTimeSeconds: endSec,
          filename: name,
          webdavPath: cleanWebdav,
          streamUrl,
        });
      } else {
        const specs = inferAudioSpecs(name, track.title || folderName);
        const isMaster = isMasterCandidate && (isRemaster || takes.length === 0);

        takes.push({
          id: `take-${takes.length + 1}-${cleanWebdav.replace(/[^a-zA-Z0-9]/g, '_')}`,
          label: isRemaster ? `${name} (Remastered)` : name,
          versionTag: isRemaster ? 'v5.1 Remastered' : isMasterCandidate ? 'v5.1 Master' : 'Alternate Take',
          isMaster,
          isRemastered: isRemaster,
          filename: name,
          webdavPath: cleanWebdav,
          streamUrl,
          format: specs.format,
          sampleRate: specs.sampleRate,
          bitDepth: specs.bitDepth,
          lufsIntegrated: specs.lufsIntegrated,
          lra: specs.lra,
          truePeakDb: specs.truePeakDb,
          spectralEnhancements: specs.spectralEnhancements,
        });

        // Advance track status
        if (isMaster) {
          highestStatus = 'Audio Master';
          statusReason = `Promoted to Audio Master via authentic release take: ${name}`;
        } else if (highestStatus !== 'Audio Master' && highestStatus !== 'Sent for Distribution' && highestStatus !== 'Released') {
          highestStatus = 'UVR5 Stem Prep';
          statusReason = `Promoted to UVR5 Stem Prep via audio stem discovery: ${name}`;
        }
      }
    }

    // 2. Video Assets
    if (lower.endsWith('.mp4') || lower.endsWith('.mov') || lower.endsWith('.mkv')) {
      const is9x16 = lower.includes('9x16') || lower.includes('portrait') || lower.includes('1080x1920');
      const is16x9 = lower.includes('16x9') || lower.includes('landscape') || lower.includes('1920x1080');

      videoMasters.push({
        id: `vid-${videoMasters.length + 1}-${name.replace(/[^a-zA-Z0-9]/g, '_')}`,
        label: name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
        aspectRatio: is9x16 ? '9:16' : is16x9 ? '16:9' : '16:9',
        resolution: is9x16 ? '1080x1920' : '1920x1080',
        filename: name,
        streamUrl,
      });

      if (highestStatus === 'Audio Master' && videoMasters.length > 0) {
        highestStatus = 'Sent for Distribution';
        statusReason = `Promoted to Sent for Distribution via master video renders: ${name}`;
      }
    }
  }

  // Infer musical keys & camelot
  const currentKey = track.key || 'E Minor';
  const camelotKey = track.camelotKey || MUSICAL_KEY_TO_CAMELOT[currentKey] || '9A';

  // Sort takes so the remastered master is first
  takes.sort((a, b) => {
    if (a.isRemastered && !b.isRemastered) return -1;
    if (!a.isRemastered && b.isRemastered) return 1;
    if (a.isMaster && !b.isMaster) return -1;
    if (!a.isMaster && b.isMaster) return 1;
    return 0;
  });

  const sunoAssets: SunoTrackAssets = {
    takes,
    snippets,
    videoMasters,
    modelEngine: track.sunoAssets?.modelEngine || 'Suno v5.1 / v5.5 BMV1',
    primaryPrompt: track.sunoPrompt,
    negativePrompt: track.negativePrompt,
    engineSliders: track.engineSliders,
    vocalArchetype: track.vocalCast || track.vocal,
    characterAnchor: 'TED-STAR_02',
    storyboardSceneCount: 30,
  };

  return {
    trackId: track.id,
    trackTitle: track.title,
    status: highestStatus,
    bpm: track.bpm || 78,
    key: currentKey,
    camelotKey,
    vocal: track.vocal || 'Brandon',
    vocalCast: track.vocalCast || `${track.vocal || 'Brandon'} (Raspy Male Lead)`,
    sunoAssets,
    newStatusReason: statusReason,
    identifiedTakesCount: takes.length,
    identifiedSnippetsCount: snippets.length,
    identifiedVideosCount: videoMasters.length,
  };
}
