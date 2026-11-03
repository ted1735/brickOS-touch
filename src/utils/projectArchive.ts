import {
  Track,
  MixerTrack,
  MixerGroup,
  DawEffectsState,
  TrackAutomationState,
  LufsMeasurementData,
  ProjectArchiveManifest
} from '../types';
import { CURRENT_STUDIO_VERSION } from './versioning';

/**
 * Generate a deterministic lightweight checksum from object contents
 */
export function computeArchiveChecksum(obj: any): string {
  const str = JSON.stringify(obj);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `sha256-lite-${hex}`;
}

export interface BuildArchiveParams {
  track: Track;
  channels: MixerTrack[];
  groups?: MixerGroup[];
  effects: DawEffectsState;
  automation: Record<number, TrackAutomationState>;
  masterVolume: number;
  isMasterMuted: boolean;
  isMasterDimmed: boolean;
  isMonoCollapsed: boolean;
  cropPreset: '30s' | '60s' | 'full';
  lufsData?: LufsMeasurementData;
  activeFxPresetId?: string;
  nextcloudBase?: string;
}

/**
 * Constructs a comprehensive Project Archive Manifest bundling current DAW states and metadata
 */
export function buildProjectArchiveManifest(params: BuildArchiveParams): ProjectArchiveManifest {
  const {
    track,
    channels,
    groups = [],
    effects,
    automation,
    masterVolume,
    isMasterMuted,
    isMasterDimmed,
    isMonoCollapsed,
    cropPreset,
    lufsData,
    activeFxPresetId,
    nextcloudBase = 'https://nextcloud.mermaid-symmetric.ts.net'
  } = params;

  const now = new Date().toISOString();
  const cleanTitle = (track.title || 'Untitled').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_');
  const archiveId = `ARCH-${track.id}-${Date.now().toString(36).toUpperCase()}`;

  const manifestData: Omit<ProjectArchiveManifest, 'checksum'> = {
    schemaVersion: 'brickos-project-archive-v1.0',
    archiveId,
    generatedAt: now,
    studioVersion: CURRENT_STUDIO_VERSION,
    track: {
      id: track.id,
      title: track.title,
      ep: track.ep || 'Master Sessions',
      genre: track.genre || 'Praise & Worship',
      bpm: track.bpm || 78,
      key: track.key || 'G Major',
      status: track.status,
      thesis: track.thesis,
      vocal: track.vocal,
      vocalCast: track.vocalCast,
      camelotKey: track.camelotKey
    },
    dawState: {
      cropPreset,
      masterVolume,
      isMasterMuted,
      isMasterDimmed,
      isMonoCollapsed,
      activeFxPresetId: activeFxPresetId || 'fx_nashville_master',
      targetLufs: effects.targetLufs || -12.0,
      truePeakCeilingDb: effects.truePeakCeilingDb ?? -1.0,
      correctionGainDb: effects.correctionGainDb || 0
    },
    channels: channels.map((c) => ({
      id: c.id,
      name: c.name,
      vol: c.vol,
      pan: c.pan,
      muted: c.muted,
      solo: c.solo,
      trimIn: c.trimIn ?? 0,
      trimOut: c.trimOut ?? 100,
      freq: c.freq,
      waveType: c.waveType,
      color: c.color,
      audioUrl: c.audioUrl,
      webdavPath: c.webdavPath,
      stemType: c.stemType,
      isRealAudio: c.isRealAudio,
      isUvrSeparated: c.isUvrSeparated,
      stemFilename: c.stemFilename,
      modelUsed: c.modelUsed,
      groupId: c.groupId
    })),
    groups: groups.map((g) => ({
      id: g.id,
      name: g.name,
      color: g.color,
      muted: g.muted,
      solo: g.solo
    })),
    effects: { ...effects },
    automation: { ...automation },
    ...(lufsData ? { lufsProfile: { ...lufsData } } : {}),
    nextcloud: {
      baseWebdavUrl: nextcloudBase,
      targetFolder: `/Music-Production/${track.id}_${cleanTitle}/`,
      manifestPath: `/Music-Production/${track.id}_${cleanTitle}/project_manifest.json`,
      stemsRemotePath: `/Music-Production/${track.id}_${cleanTitle}/stems/`
    }
  };

  const checksum = computeArchiveChecksum(manifestData);

  return {
    ...manifestData,
    checksum
  };
}

/**
 * Triggers a browser download of the Project Archive JSON file
 */
export function downloadProjectArchiveFile(manifest: ProjectArchiveManifest): void {
  const jsonContent = JSON.stringify(manifest, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const cleanTitle = (manifest.track.title || 'Untitled').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_');
  const filename = `${manifest.track.id}_${cleanTitle}_Project_Archive_${manifest.studioVersion}.json`;

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * Validates a parsed or stringified JSON payload as a valid Project Archive Manifest
 */
export function validateProjectArchive(input: string | any): {
  valid: boolean;
  manifest?: ProjectArchiveManifest;
  error?: string;
} {
  try {
    const data = typeof input === 'string' ? JSON.parse(input) : input;

    if (!data || typeof data !== 'object') {
      return { valid: false, error: 'Manifest must be a valid JSON object.' };
    }

    if (data.schemaVersion !== 'brickos-project-archive-v1.0') {
      return {
        valid: false,
        error: `Unsupported schemaVersion: "${data.schemaVersion || 'none'}". Expected "brickos-project-archive-v1.0".`
      };
    }

    if (!data.track || !data.track.id || !data.track.title) {
      return { valid: false, error: 'Manifest is missing required track metadata (id, title).' };
    }

    if (!Array.isArray(data.channels) || data.channels.length === 0) {
      return { valid: false, error: 'Manifest channels array is missing or empty.' };
    }

    if (!data.effects || !data.effects.eq || !data.effects.compressor) {
      return { valid: false, error: 'Manifest is missing required master effects rack state.' };
    }

    return { valid: true, manifest: data as ProjectArchiveManifest };
  } catch (err: any) {
    return { valid: false, error: `JSON Parse error: ${err.message || 'Invalid JSON syntax'}` };
  }
}

export interface NextcloudWriteResult {
  success: boolean;
  archiveId?: string;
  manifestPath?: string;
  checksum?: string;
  verified: boolean;
  etag?: string;
  serverBytes?: number;
  firestoreWritten?: boolean;
  latencyMs?: number;
  message?: string;
  error?: string;
}

/**
 * Persists the project archive manifest to the primary Nextcloud WebDAV destination
 * and returns verified read-after-write telemetry.
 */
export async function saveProjectArchiveToNextcloud(
  manifest: ProjectArchiveManifest
): Promise<NextcloudWriteResult> {
  try {
    const res = await fetch('/api/project/archive', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ manifest })
    });
    const data = await res.json();
    return {
      success: !!data.success,
      archiveId: data.archiveId,
      manifestPath: data.manifestPath,
      checksum: data.checksum,
      verified: !!data.verification?.verified,
      etag: data.verification?.etag,
      serverBytes: data.verification?.serverBytes,
      firestoreWritten: !!data.firestoreWritten,
      latencyMs: data.latencyMs,
      message: data.message,
      error: data.error
    };
  } catch (err: any) {
    return {
      success: false,
      verified: false,
      error: err?.message || 'Failed to save project archive to Nextcloud'
    };
  }
}

