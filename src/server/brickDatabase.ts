import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';

/**
 * brickOS Unified Sovereign Database Bridge
 * ==============================================================================
 * Connects brickOS web services directly to the single master SQLite database
 * (brickos.db) synced across Nextcloud, CT 120 production, and Windows workstation.
 */

export interface DatabaseStats {
  connected: boolean;
  dbPath: string;
  tables: Record<string, number>;
  totalRows: number;
  timestamp: string;
}

export function resolveDatabasePath(): string {
  if (process.env.BRICKOS_DB_PATH && fs.existsSync(process.env.BRICKOS_DB_PATH)) {
    return process.env.BRICKOS_DB_PATH;
  }
  const candidates = [
    '/var/www/nextcloud-data/ncted/files/Music-Production/brickOS/brickos.db',
    'D:/Users/tedmo/Nextcloud/Music-Production/brickOS/brickos.db',
    'D:\\Users\\tedmo\\Nextcloud\\Music-Production\\brickOS\\brickos.db',
    path.resolve(process.cwd(), '../Nextcloud/Music-Production/brickOS/brickos.db'),
    path.resolve(process.cwd(), '../../Nextcloud/Music-Production/brickOS/brickos.db'),
    path.resolve(process.cwd(), 'brickos.db'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  return candidates[0];
}

let dbInstance: DatabaseSync | null = null;

export function getDatabase(): DatabaseSync {
  if (!dbInstance) {
    const dbPath = resolveDatabasePath();
    console.log('[brickOS-DB] Connecting to unified database at:', dbPath);
    dbInstance = new DatabaseSync(dbPath);
  }
  return dbInstance;
}

export function getDatabaseStats(): DatabaseStats {
  try {
    const db = getDatabase();
    const tablesStmt = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
    const tableRows = tablesStmt.all() as Array<{ name: string }>;
    const tables: Record<string, number> = {};
    let totalRows = 0;

    for (const row of tableRows) {
      try {
        const countStmt = db.prepare(`SELECT COUNT(*) as count FROM [${row.name}]`);
        const cRow = countStmt.get() as { count: number };
        tables[row.name] = cRow ? cRow.count : 0;
        totalRows += tables[row.name];
      } catch {
        tables[row.name] = 0;
      }
    }

    return {
      connected: true,
      dbPath: resolveDatabasePath(),
      tables,
      totalRows,
      timestamp: new Date().toISOString(),
    };
  } catch (err: any) {
    console.error('[brickOS-DB] Failed to query database stats:', err);
    return {
      connected: false,
      dbPath: resolveDatabasePath(),
      tables: {},
      totalRows: 0,
      timestamp: new Date().toISOString(),
    };
  }
}

export function getAllTracks(): any[] {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT t.*, 
      (SELECT COUNT(*) FROM track_versions v WHERE v.track_id = t.id) as version_count,
      (SELECT COUNT(*) FROM lyric_sections s WHERE s.track_id = t.id) as section_count,
      (SELECT COUNT(*) FROM audio_stems st WHERE st.track_id = t.id) as stem_count,
      (SELECT COUNT(*) FROM visual_assets va WHERE va.track_id = t.id) as visual_count
    FROM tracks t
    ORDER BY t.id ASC
  `);
  return stmt.all();
}

export function getTrackDetail(trackId: string): any | null {
  const db = getDatabase();
  const trackStmt = db.prepare('SELECT * FROM tracks WHERE id = ? OR title LIKE ?');
  const track = trackStmt.get(trackId, `%${trackId}%`);
  if (!track) return null;

  const realId = (track as any).id;

  const versionsStmt = db.prepare('SELECT * FROM track_versions WHERE track_id = ? ORDER BY id DESC');
  const sectionsStmt = db.prepare('SELECT * FROM lyric_sections WHERE track_id = ? ORDER BY section_order ASC');
  const stemsStmt = db.prepare('SELECT * FROM audio_stems WHERE track_id = ? ORDER BY id ASC');
  const visualsStmt = db.prepare('SELECT * FROM visual_assets WHERE track_id = ? ORDER BY id ASC');
  const relationshipsStmt = db.prepare('SELECT * FROM asset_relationships WHERE track_id = ?');
  const masteringStmt = db.prepare('SELECT * FROM mastering_analyses WHERE track_title LIKE ?');

  return {
    ...track,
    versions: versionsStmt.all(realId),
    sections: sectionsStmt.all(realId),
    stems: stemsStmt.all(realId),
    visuals: visualsStmt.all(realId),
    relationships: relationshipsStmt.all(realId),
    masteringAnalyses: masteringStmt.all(`%${(track as any).title}%`),
  };
}

export function getMasteringAnalyses(): any[] {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT id, track_title, vocal_artist, original_file, remaster_file, engine,
           original_lufs, remaster_lufs, original_lra, remaster_lra,
           original_true_peak, remaster_true_peak,
           sub_20_60hz_db, bass_60_250hz_db, low_mid_250_500hz_db, mid_500_2000hz_db,
           high_mid_2k_6khz_db, presence_air_6k_16khz_db, ultrasonic_16k_24khz_db,
           created_at
    FROM mastering_analyses
    ORDER BY id DESC
  `);
  return stmt.all();
}

export function getSunoLedger(month?: string): any {
  const db = getDatabase();
  const targetMonth = month || new Date().toISOString().substring(0, 7);
  const stmt = db.prepare(`
    SELECT * FROM suno_downloads_ledger
    WHERE billing_cycle_month = ?
    ORDER BY id DESC
  `);
  const downloads = stmt.all(targetMonth) as any[];

  const quotaSpent = downloads.reduce((acc, row) => acc + (row.quota_cost || 0), 0);
  const exemptCount = downloads.filter((row) => row.is_pre_policy_exemption === 1 || row.quota_cost === 0).length;

  return {
    billingCycleMonth: targetMonth,
    downloads,
    quotaSpent,
    totalDownloads: downloads.length,
    exemptCount,
    tierLimitPremier: 60,
    tierLimitPro: 20,
    remainingPremier: Math.max(0, 60 - quotaSpent),
    remainingPro: Math.max(0, 20 - quotaSpent),
  };
}

export function logSunoDownload(payload: {
  sunoClipId: string;
  trackId?: string;
  songTitle: string;
  versionLabel?: string;
  downloadFormat?: string;
  billingCycleMonth?: string;
  localFilePath?: string;
  fileSizeBytes?: number;
  checksumSha256?: string;
  isPrePolicyExemption?: number;
  quotaCost?: number;
  status?: string;
  notes?: string;
}): any {
  const db = getDatabase();
  const currentMonth = payload.billingCycleMonth || new Date().toISOString().substring(0, 7);
  const stmt = db.prepare(`
    INSERT INTO suno_downloads_ledger (
      suno_clip_id, track_id, song_title, version_label, download_format,
      billing_cycle_month, local_file_path, file_size_bytes, checksum_sha256,
      is_pre_policy_exemption, quota_cost, status, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    payload.sunoClipId,
    payload.trackId || null,
    payload.songTitle,
    payload.versionLabel || 'Master Take',
    payload.downloadFormat || 'WAV',
    currentMonth,
    payload.localFilePath || null,
    payload.fileSizeBytes || null,
    payload.checksumSha256 || null,
    payload.isPrePolicyExemption || 0,
    payload.quotaCost ?? 1,
    payload.status || 'Downloaded',
    payload.notes || 'Logged via brickOS Studio Database API'
  );

  return { success: true, insertedId: result.lastInsertRowid };
}

export function updateTrackLyrics(trackId: string, lyrics: string, commitReason?: string): any {
  const db = getDatabase();
  const updateTrack = db.prepare('UPDATE tracks SET lyrics = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
  updateTrack.run(lyrics, trackId);

  const insertVersion = db.prepare(`
    INSERT INTO track_versions (track_id, version_id, commit_reason, lyrics)
    VALUES (?, ?, ?, ?)
  `);
  const versionTag = `v${new Date().toISOString().replace(/[-:T]/g, '').substring(0, 12)}`;
  insertVersion.run(trackId, versionTag, commitReason || 'Lyric commit via brickOS Studio Web Console', lyrics);

  return { success: true, trackId, versionTag };
}

export function getVocalArchetypes(): any[] {
  const db = getDatabase();
  return db.prepare('SELECT * FROM vocal_archetypes ORDER BY name ASC').all();
}

export function getEpCollections(): any[] {
  const db = getDatabase();
  return db.prepare('SELECT * FROM ep_collections ORDER BY id ASC').all();
}
