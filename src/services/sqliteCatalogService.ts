import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { DatabaseSync } from 'node:sqlite';
import { RELATIONAL_SUNO_CATALOG, CanonicalSongRelationalItem, SunoRevisionItem } from '../data/relationalSunoCatalog';
import { ALL_CANONICAL_NEXTCLOUD_ASSETS } from '../data/nextcloudAssetIndex';
import { CANONICAL_TRACKS } from '../data/canonicalCatalog';

// Primary Nextcloud-synced path on Windows dev machine; falls back to local server data folder on Linux CT 120
const NEXTCLOUD_DB_DIR = 'D:\\Users\\tedmo\\Nextcloud\\Music-Production\\brickOS';
const FALLBACK_DB_DIR = path.join(process.cwd(), 'data');

export function resolveSqliteDbPath(): string {
  try {
    if (fs.existsSync('D:\\Users\\tedmo\\Nextcloud\\Music-Production')) {
      fs.mkdirSync(NEXTCLOUD_DB_DIR, { recursive: true });
      return path.join(NEXTCLOUD_DB_DIR, 'brickos-studio.db');
    }
  } catch {}
  fs.mkdirSync(FALLBACK_DB_DIR, { recursive: true });
  return path.join(FALLBACK_DB_DIR, 'brickos-studio.db');
}

let sqliteDb: any = null;
let catalogEtag = `"brickos-db-${Date.now()}"`;

export function getCatalogEtag(): string {
  return catalogEtag;
}

export function refreshCatalogEtag(): string {
  catalogEtag = `"brickos-db-${Date.now()}-${crypto.randomBytes(4).toString('hex')}"`;
  return catalogEtag;
}

export function getStudioDb(): any {
  if (sqliteDb) return sqliteDb;

  try {
    const dbPath = resolveSqliteDbPath();
    const db = new DatabaseSync(dbPath);

    // Enable WAL mode and high-performance pragmas
    db.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA synchronous = NORMAL;
      PRAGMA temp_store = MEMORY;
      PRAGMA cache_size = -64000;
      PRAGMA foreign_keys = ON;
    `);

    // Create tables
    db.exec(`
      CREATE TABLE IF NOT EXISTS canonical_songs (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        ep TEXT,
        genre TEXT,
        bpm INTEGER,
        key_signature TEXT,
        vocal_cast TEXT,
        thesis TEXT,
        nextcloud_directory TEXT,
        suno_takes_directory TEXT,
        revision_count INTEGER DEFAULT 0,
        lyrics TEXT,
        suno_prompt TEXT,
        status TEXT DEFAULT 'In Progress',
        folder_etag TEXT,
        payload_hash TEXT,
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS suno_revisions (
        suno_clip_id TEXT PRIMARY KEY,
        song_id TEXT NOT NULL,
        title TEXT NOT NULL,
        created_at TEXT,
        duration_seconds REAL,
        model TEXT,
        style_tags TEXT,
        stream_url TEXT,
        local_cached_path TEXT,
        image_url TEXT,
        has_lyrics INTEGER DEFAULT 0,
        prompt_excerpt TEXT,
        FOREIGN KEY (song_id) REFERENCES canonical_songs(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_suno_revisions_song_id ON suno_revisions(song_id);

      CREATE TABLE IF NOT EXISTS nextcloud_assets (
        id TEXT PRIMARY KEY,
        track_id TEXT NOT NULL,
        filename TEXT NOT NULL,
        webdav_path TEXT NOT NULL,
        category TEXT,
        mime_type TEXT,
        file_size_bytes INTEGER DEFAULT 0,
        stream_url TEXT,
        etag TEXT,
        updated_at TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_nextcloud_assets_track_id ON nextcloud_assets(track_id);

      CREATE TABLE IF NOT EXISTS waveform_peaks (
        asset_key TEXT PRIMARY KEY,
        peaks_json TEXT NOT NULL,
        integrated_lufs REAL DEFAULT -14.0,
        true_peak_db REAL DEFAULT -1.0,
        duration_seconds REAL DEFAULT 0,
        computed_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS folder_etags (
        folder_path TEXT PRIMARY KEY,
        etag TEXT NOT NULL,
        last_checked_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS server_kv_state (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS mcp_servers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        auth_type TEXT DEFAULT 'none',
        auth_header_name TEXT DEFAULT 'Authorization',
        auth_token TEXT DEFAULT '',
        enabled INTEGER DEFAULT 1,
        is_primary INTEGER DEFAULT 0,
        last_status TEXT DEFAULT 'pending',
        last_latency_ms INTEGER DEFAULT 0,
        last_error TEXT DEFAULT '',
        server_info_json TEXT DEFAULT '{}',
        tools_json TEXT DEFAULT '[]',
        resources_json TEXT DEFAULT '[]',
        last_synced_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS mcp_pinned_widgets (
        id TEXT PRIMARY KEY,
        server_id TEXT NOT NULL,
        tool_name TEXT NOT NULL,
        title TEXT NOT NULL,
        args_json TEXT DEFAULT '{}',
        last_result_json TEXT DEFAULT 'null',
        last_run_at TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (server_id) REFERENCES mcp_servers(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS social_outlet_statuses (
        track_id TEXT NOT NULL,
        outlet_key TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Not Started',
        scheduled_slot TEXT DEFAULT '',
        post_url TEXT DEFAULT '',
        post_id TEXT DEFAULT '',
        cohort TEXT DEFAULT 'Cohort C',
        playlist_id TEXT DEFAULT '',
        notes TEXT DEFAULT '',
        updated_at TEXT NOT NULL,
        PRIMARY KEY (track_id, outlet_key)
      );

      CREATE TABLE IF NOT EXISTS mcp_telemetry_cache (
        cache_key TEXT PRIMARY KEY,
        payload_json TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);

    sqliteDb = db;
    seedDatabaseIfNeeded(db);
    ensureDefaultMcpServer(db);
    console.log(`[SQLite Studio DB] Initialized WAL database at ${dbPath}`);
    return sqliteDb;
  } catch (err) {
    console.warn('[SQLite Studio DB] Native node:sqlite fallback notice:', err);
    return null;
  }
}

function seedDatabaseIfNeeded(db: any) {
  try {
    const countRow = db.prepare('SELECT COUNT(*) as cnt FROM canonical_songs').get() as { cnt: number };
    const revRow = db.prepare('SELECT COUNT(*) as cnt FROM suno_revisions').get() as { cnt: number };

    if (countRow && countRow.cnt >= RELATIONAL_SUNO_CATALOG.length && revRow && revRow.cnt >= 372) {
      return;
    }

    const now = new Date().toISOString();
    const insertSong = db.prepare(`
      INSERT OR REPLACE INTO canonical_songs (
        id, title, ep, genre, bpm, key_signature, vocal_cast, thesis,
        nextcloud_directory, suno_takes_directory, revision_count,
        lyrics, suno_prompt, status, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertRev = db.prepare(`
      INSERT OR REPLACE INTO suno_revisions (
        suno_clip_id, song_id, title, created_at, duration_seconds,
        model, style_tags, stream_url, local_cached_path, image_url,
        has_lyrics, prompt_excerpt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertAsset = db.prepare(`
      INSERT OR REPLACE INTO nextcloud_assets (
        id, track_id, filename, webdav_path, category, mime_type,
        file_size_bytes, stream_url, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    db.exec('BEGIN TRANSACTION');
    try {
      for (const song of RELATIONAL_SUNO_CATALOG) {
        const canonicalMatch = CANONICAL_TRACKS.find(t => t.id === song.id || t.title.toLowerCase() === song.title.toLowerCase());
        const nextcloudDir = (song as any).nextcloudDirectory || 'Music-Production/SunoMasterFiles';
        const sunoTakesDir = (song as any).sunoTakesDirectory || 'Music-Production/SunoMasterFiles';

        insertSong.run(
          song.id,
          song.title,
          song.ep,
          song.genre,
          song.bpm,
          song.key,
          song.vocalCast,
          song.thesis,
          nextcloudDir,
          sunoTakesDir,
          song.revisionCount,
          canonicalMatch?.lyrics || '',
          canonicalMatch?.sunoPrompt || '',
          canonicalMatch?.status || 'Audio Master',
          now
        );

        for (const rev of song.revisions) {
          insertRev.run(
            rev.sunoClipId,
            song.id,
            rev.title,
            rev.createdAt,
            rev.durationSeconds,
            rev.model,
            rev.styleTags,
            rev.streamUrl,
            null,
            rev.imageUrl,
            rev.hasLyrics ? 1 : 0,
            rev.promptExcerpt
          );
        }
      }

      for (const asset of ALL_CANONICAL_NEXTCLOUD_ASSETS) {
        insertAsset.run(
          asset.id,
          asset.matchedTrackId || 'TRK-01',
          asset.filename,
          asset.webdavPath,
          asset.category,
          asset.mimeType || 'audio/wav',
          asset.fileSizeBytes || 0,
          asset.audioUrl || `/api/nextcloud/stream?path=${encodeURIComponent(asset.webdavPath)}`,
          now
        );
      }

      db.exec('COMMIT');
      refreshCatalogEtag();
      console.log(`[SQLite Studio DB] Seeded ${RELATIONAL_SUNO_CATALOG.length} canonical songs, 372 Suno revisions, and ${ALL_CANONICAL_NEXTCLOUD_ASSETS.length} Nextcloud assets.`);
    } catch (txErr) {
      db.exec('ROLLBACK');
      throw txErr;
    }
  } catch (err) {
    console.warn('[SQLite Studio DB] Seed warning:', err);
  }
}

// ============================================================================
// QUERY & DELTA-SYNC HELPERS
// ============================================================================

export function queryFullRelationalCatalog(): CanonicalSongRelationalItem[] {
  const db = getStudioDb();
  if (!db) return RELATIONAL_SUNO_CATALOG;

  try {
    const songs = db.prepare('SELECT * FROM canonical_songs ORDER BY id ASC').all() as any[];
    const revisions = db.prepare('SELECT * FROM suno_revisions ORDER BY created_at DESC').all() as any[];

    const revBySong = new Map<string, SunoRevisionItem[]>();
    for (const r of revisions) {
      const list = revBySong.get(r.song_id) || [];
      list.push({
        sunoClipId: r.suno_clip_id,
        title: r.title,
        createdAt: r.created_at,
        durationSeconds: r.duration_seconds,
        model: r.model,
        styleTags: r.style_tags,
        streamUrl: r.stream_url,
        imageUrl: r.image_url,
        hasLyrics: Boolean(r.has_lyrics),
        promptExcerpt: r.prompt_excerpt,
        ...(r.local_cached_path ? { localCachedPath: r.local_cached_path } : {})
      } as any);
      revBySong.set(r.song_id, list);
    }

    return songs.map(s => ({
      id: s.id,
      title: s.title,
      ep: s.ep,
      genre: s.genre,
      bpm: s.bpm,
      key: s.key_signature,
      vocalCast: s.vocal_cast,
      thesis: s.thesis,
      nextcloudDirectory: s.nextcloud_directory,
      sunoTakesDirectory: s.suno_takes_directory,
      revisionCount: (revBySong.get(s.id) || []).length,
      revisions: revBySong.get(s.id) || []
    }));
  } catch (err) {
    console.warn('[SQLite Studio DB] Query fallback to memory catalog:', err);
    return RELATIONAL_SUNO_CATALOG;
  }
}

export function getSunoRevisionById(clipId: string): {
  sunoClipId: string;
  songId: string;
  title: string;
  streamUrl: string;
  localCachedPath: string | null;
  localCachePath: string | null;
  sunoTakesDirectory: string;
} | null {
  const db = getStudioDb();
  if (db) {
    try {
      const row = db.prepare(`
        SELECT r.suno_clip_id, r.song_id, r.title, r.stream_url, r.local_cached_path, s.suno_takes_directory
        FROM suno_revisions r
        LEFT JOIN canonical_songs s ON s.id = r.song_id
        WHERE r.suno_clip_id = ?
      `).get(clipId) as any;
      if (row) {
        return {
          sunoClipId: row.suno_clip_id,
          songId: row.song_id,
          title: row.title,
          streamUrl: row.stream_url,
          localCachedPath: row.local_cached_path || null,
          localCachePath: row.local_cached_path || null,
          sunoTakesDirectory: row.suno_takes_directory || 'Music-Production/SunoMasterFiles'
        };
      }
    } catch {}
  }

  for (const song of RELATIONAL_SUNO_CATALOG) {
    const found = song.revisions.find(r => r.sunoClipId === clipId);
    if (found) {
      return {
        sunoClipId: found.sunoClipId,
        songId: song.id,
        title: found.title,
        streamUrl: found.streamUrl,
        localCachedPath: null,
        localCachePath: null,
        sunoTakesDirectory: (song as any).sunoTakesDirectory || 'Music-Production/SunoMasterFiles'
      };
    }
  }
  return null;
}

export function updateSunoRevisionLocalCachePath(clipId: string, localPath: string) {
  const db = getStudioDb();
  if (!db) return;
  try {
    db.prepare('UPDATE suno_revisions SET local_cached_path = ? WHERE suno_clip_id = ?').run(localPath, clipId);
  } catch {}
}

export function getCachedFolderEtag(folderPath: string): string | null {
  const db = getStudioDb();
  if (!db) return null;
  try {
    const row = db.prepare('SELECT etag FROM folder_etags WHERE folder_path = ?').get(folderPath) as any;
    return row ? row.etag : null;
  } catch {
    return null;
  }
}

export function setCachedFolderEtag(folderPath: string, etag: string, _assetCount = 0) {
  const db = getStudioDb();
  if (!db) return;
  try {
    db.prepare(`
      INSERT OR REPLACE INTO folder_etags (folder_path, etag, last_checked_at)
      VALUES (?, ?, ?)
    `).run(folderPath, etag, new Date().toISOString());
  } catch {}
}

export function checkAndUpdateSongPayloadHash(songId: string, payloadObj: any): boolean {
  const db = getStudioDb();
  const hash = crypto.createHash('sha256').update(JSON.stringify(payloadObj)).digest('hex');
  if (!db) return true;

  try {
    const row = db.prepare('SELECT payload_hash FROM canonical_songs WHERE id = ?').get(songId) as any;
    if (row && row.payload_hash === hash) {
      return false; // Not dirty! Skip redundant Firestore write
    }
    db.prepare('UPDATE canonical_songs SET payload_hash = ?, updated_at = ? WHERE id = ?').run(
      hash,
      new Date().toISOString(),
      songId
    );
    return true; // Dirty! Needs sync
  } catch {
    return true;
  }
}

export function getCachedWaveformPeaks(assetKey: string): {
  assetId: string;
  barCount: number;
  peaks: number[];
  integratedLufs: number;
  truePeakDb: number;
  truePeakDbtp: number;
  durationSeconds: number;
  durationSec: number;
} | null {
  const db = getStudioDb();
  if (!db) return null;
  try {
    const row = db.prepare('SELECT * FROM waveform_peaks WHERE asset_key = ?').get(assetKey) as any;
    if (row && row.peaks_json) {
      const peaks = JSON.parse(row.peaks_json);
      return {
        assetId: assetKey,
        barCount: peaks.length,
        peaks,
        integratedLufs: row.integrated_lufs,
        truePeakDb: row.true_peak_db,
        truePeakDbtp: row.true_peak_db,
        durationSeconds: row.duration_seconds,
        durationSec: row.duration_seconds
      };
    }
  } catch {}
  return null;
}

export function saveCachedWaveformPeaks(
  assetKeyOrObj: string | {
    assetId: string;
    barCount?: number;
    peaks: number[];
    integratedLufs?: number;
    truePeakDbtp?: number;
    truePeakDb?: number;
    durationSec?: number;
    durationSeconds?: number;
  },
  peaksArg?: number[],
  integratedLufsArg = -14.0,
  truePeakDbArg = -1.0,
  durationSecondsArg = 0
) {
  const isObj = typeof assetKeyOrObj === 'object' && assetKeyOrObj !== null;
  const assetKey = isObj ? assetKeyOrObj.assetId : assetKeyOrObj;
  const peaks = isObj ? assetKeyOrObj.peaks : (peaksArg || []);
  const integratedLufs = isObj ? (assetKeyOrObj.integratedLufs ?? -14.0) : integratedLufsArg;
  const truePeakDb = isObj ? (assetKeyOrObj.truePeakDbtp ?? assetKeyOrObj.truePeakDb ?? -1.0) : truePeakDbArg;
  const durationSeconds = isObj ? (assetKeyOrObj.durationSec ?? assetKeyOrObj.durationSeconds ?? 0) : durationSecondsArg;

  const db = getStudioDb();
  if (db) {
    try {
      db.prepare(`
        INSERT OR REPLACE INTO waveform_peaks (
          asset_key, peaks_json, integrated_lufs, true_peak_db, duration_seconds, computed_at
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        assetKey,
        JSON.stringify(peaks),
        integratedLufs,
        truePeakDb,
        durationSeconds,
        new Date().toISOString()
      );
    } catch {}
  }

  return {
    assetId: assetKey,
    barCount: peaks.length,
    peaks,
    integratedLufs,
    truePeakDb,
    truePeakDbtp: truePeakDb,
    durationSeconds,
    durationSec: durationSeconds
  };
}

export function getStudioDbStats() {
  const db = getStudioDb();
  const dbPath = resolveSqliteDbPath();
  let fileSizeBytes = 0;
  try {
    if (fs.existsSync(dbPath)) {
      fileSizeBytes = fs.statSync(dbPath).size;
    }
  } catch {}

  if (!db) {
    return {
      active: false,
      dbPath,
      fileSizeBytes,
      songsCount: RELATIONAL_SUNO_CATALOG.length,
      revisionsCount: 372,
      assetsCount: ALL_CANONICAL_NEXTCLOUD_ASSETS.length,
      cachedPeaksCount: 0,
      trackedFolderEtags: 0
    };
  }

  try {
    const songsCount = (db.prepare('SELECT COUNT(*) as c FROM canonical_songs').get() as any)?.c || 0;
    const revisionsCount = (db.prepare('SELECT COUNT(*) as c FROM suno_revisions').get() as any)?.c || 0;
    const assetsCount = (db.prepare('SELECT COUNT(*) as c FROM nextcloud_assets').get() as any)?.c || 0;
    const cachedPeaksCount = (db.prepare('SELECT COUNT(*) as c FROM waveform_peaks').get() as any)?.c || 0;
    const trackedFolderEtags = (db.prepare('SELECT COUNT(*) as c FROM folder_etags').get() as any)?.c || 0;

    return {
      active: true,
      engine: 'node:sqlite (WAL Mode)',
      dbPath,
      fileSizeBytes,
      catalogEtag,
      songsCount,
      revisionsCount,
      assetsCount,
      cachedPeaksCount,
      trackedFolderEtags
    };
  } catch {
    return { active: false, dbPath, fileSizeBytes };
  }
}

export function upsertRelinkedAssetInSqlite(params: {
  trackId: string;
  webdavPath: string;
  filename: string;
  category?: string;
  mimeType?: string;
  fileSizeBytes?: number;
  directoryPath?: string;
}) {
  const db = getStudioDb();
  if (!db || !params.trackId || !params.webdavPath) return false;
  try {
    const now = new Date().toISOString();
    const assetId = `RELINK-${params.trackId}-${crypto.createHash('md5').update(params.webdavPath).digest('hex').slice(0, 8)}`;
    db.prepare(`
      INSERT OR REPLACE INTO nextcloud_assets (
        id, track_id, filename, webdav_path, category, mime_type,
        file_size_bytes, stream_url, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      assetId,
      params.trackId,
      params.filename,
      params.webdavPath,
      params.category || 'Relinked Audio',
      params.mimeType || 'audio/mpeg',
      params.fileSizeBytes || 0,
      `/api/nextcloud/stream?path=${encodeURIComponent(params.webdavPath)}&trackId=${encodeURIComponent(params.trackId)}`,
      now
    );

    if (params.directoryPath) {
      db.prepare(`
        UPDATE canonical_songs
        SET nextcloud_directory = ?, updated_at = ?
        WHERE id = ?
      `).run(params.directoryPath, now, params.trackId);
    }

    refreshCatalogEtag();
    return true;
  } catch (err) {
    console.warn('[SQLite Studio DB] Relink upsert warning:', err);
    return false;
  }
}

export function querySunoRevisionsForTrack(trackId?: string, title?: string): Array<{
  sunoClipId: string;
  songId: string;
  title: string;
  streamUrl: string;
  createdAt?: string;
  model?: string;
  durationSeconds?: number;
}> {
  const db = getStudioDb();
  if (!db) return [];
  try {
    if (trackId) {
      const rows = db.prepare(`
        SELECT suno_clip_id, song_id, title, stream_url, created_at, model, duration_seconds
        FROM suno_revisions
        WHERE UPPER(song_id) = UPPER(?) AND stream_url IS NOT NULL AND stream_url != ''
        ORDER BY created_at DESC
      `).all(trackId) as any[];
      if (rows.length > 0) {
        return rows.map((r) => ({
          sunoClipId: r.suno_clip_id,
          songId: r.song_id,
          title: r.title,
          streamUrl: r.stream_url,
          createdAt: r.created_at,
          model: r.model,
          durationSeconds: r.duration_seconds
        }));
      }
    }

    if (title && title.trim().length > 2) {
      const cleanTitle = title.trim().toLowerCase();
      const songs = db.prepare('SELECT id, title FROM canonical_songs').all() as any[];
      const matched = songs.find(
        (s) =>
          s.title.toLowerCase() === cleanTitle ||
          s.title.toLowerCase().includes(cleanTitle) ||
          cleanTitle.includes(s.title.toLowerCase())
      );
      if (matched) {
        const rows = db.prepare(`
          SELECT suno_clip_id, song_id, title, stream_url, created_at, model, duration_seconds
          FROM suno_revisions
          WHERE song_id = ? AND stream_url IS NOT NULL AND stream_url != ''
          ORDER BY created_at DESC
        `).all(matched.id) as any[];
        return rows.map((r) => ({
          sunoClipId: r.suno_clip_id,
          songId: r.song_id,
          title: r.title,
          streamUrl: r.stream_url,
          createdAt: r.created_at,
          model: r.model,
          durationSeconds: r.duration_seconds
        }));
      }
    }
  } catch {}
  return [];
}

export function getServerKvState(key: string): string | null {
  const db = getStudioDb();
  if (!db) return null;
  try {
    const row = db.prepare('SELECT value FROM server_kv_state WHERE key = ?').get(key) as { value?: string } | undefined;
    return row?.value ?? null;
  } catch {
    return null;
  }
}

export function setServerKvState(key: string, value: string): void {
  const db = getStudioDb();
  if (!db) return;
  try {
    db.prepare(`
      INSERT INTO server_kv_state (key, value, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        updated_at = excluded.updated_at
    `).run(key, value, new Date().toISOString());
  } catch {}
}

export interface StoredMcpServerRecord {
  id: string;
  name: string;
  url: string;
  authType: 'none' | 'bearer' | 'header';
  authHeaderName: string;
  authToken: string;
  hasAuthToken: boolean;
  enabled: boolean;
  isPrimary: boolean;
  lastStatus: string;
  lastLatencyMs: number;
  lastError: string;
  serverInfo: Record<string, any>;
  tools: any[];
  resources: any[];
  lastSyncedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export function ensureDefaultMcpServer(dbInstance?: any): void {
  const db = dbInstance || getStudioDb();
  if (!db) return;
  try {
    const now = new Date().toISOString();
    const existing = db.prepare(`SELECT id FROM mcp_servers WHERE id = 'brickos-primary-mcp'`).get();
    if (!existing) {
      db.prepare(`
        INSERT INTO mcp_servers (
          id, name, url, auth_type, auth_header_name, auth_token,
          enabled, is_primary, last_status, last_latency_ms, last_error,
          server_info_json, tools_json, resources_json, last_synced_at, created_at, updated_at
        ) VALUES (?, ?, ?, 'none', 'Authorization', '', 1, 1, 'ready', 0, '', '{}', '[]', '[]', NULL, ?, ?)
      `).run(
        'brickos-primary-mcp',
        'brickOS Remote MCP (brick-mcp.moyercloud.com)',
        'https://brick-mcp.moyercloud.com/mcp',
        now,
        now
      );
    }
  } catch (err) {
    console.warn('[SQLite MCP] Seed default MCP server warning:', err);
  }
}

function mapMcpServerRow(r: any, includeSecrets = false): StoredMcpServerRecord {
  let serverInfo: Record<string, any> = {};
  let tools: any[] = [];
  let resources: any[] = [];
  try { serverInfo = JSON.parse(r.server_info_json || '{}'); } catch {}
  try { tools = JSON.parse(r.tools_json || '[]'); } catch {}
  try { resources = JSON.parse(r.resources_json || '[]'); } catch {}
  const rawToken = String(r.auth_token || '');
  return {
    id: r.id,
    name: r.name,
    url: r.url,
    authType: (r.auth_type || 'none') as 'none' | 'bearer' | 'header',
    authHeaderName: r.auth_header_name || 'Authorization',
    authToken: includeSecrets ? rawToken : (rawToken ? '••••••••' : ''),
    hasAuthToken: rawToken.length > 0,
    enabled: Boolean(r.enabled),
    isPrimary: Boolean(r.is_primary),
    lastStatus: r.last_status || 'pending',
    lastLatencyMs: Number(r.last_latency_ms || 0),
    lastError: r.last_error || '',
    serverInfo,
    tools,
    resources,
    lastSyncedAt: r.last_synced_at || null,
    createdAt: r.created_at,
    updatedAt: r.updated_at
  };
}

export function listMcpServersFromSqlite(includeSecrets = false): StoredMcpServerRecord[] {
  const db = getStudioDb();
  if (!db) return [];
  ensureDefaultMcpServer(db);
  try {
    const rows = db.prepare('SELECT * FROM mcp_servers ORDER BY is_primary DESC, created_at ASC').all() as any[];
    return rows.map((r) => mapMcpServerRow(r, includeSecrets));
  } catch {
    return [];
  }
}

export function getMcpServerByIdFromSqlite(id: string, includeSecrets = true): StoredMcpServerRecord | null {
  const db = getStudioDb();
  if (!db) return null;
  ensureDefaultMcpServer(db);
  try {
    const row = db.prepare('SELECT * FROM mcp_servers WHERE id = ?').get(id) as any;
    return row ? mapMcpServerRow(row, includeSecrets) : null;
  } catch {
    return null;
  }
}

export function upsertMcpServerInSqlite(input: {
  id?: string;
  name: string;
  url: string;
  authType?: 'none' | 'bearer' | 'header';
  authHeaderName?: string;
  authToken?: string;
  enabled?: boolean;
  isPrimary?: boolean;
}): StoredMcpServerRecord | null {
  const db = getStudioDb();
  if (!db) return null;
  ensureDefaultMcpServer(db);
  const now = new Date().toISOString();
  const id = (input.id && input.id.trim()) || `mcp-${crypto.randomBytes(5).toString('hex')}`;
  const existing = db.prepare('SELECT * FROM mcp_servers WHERE id = ?').get(id) as any;

  let finalToken = existing?.auth_token || '';
  if (typeof input.authToken === 'string' && input.authToken !== '••••••••') {
    finalToken = input.authToken.trim();
  }
  if (input.authType === 'none') {
    finalToken = '';
  }

  db.prepare(`
    INSERT INTO mcp_servers (
      id, name, url, auth_type, auth_header_name, auth_token,
      enabled, is_primary, last_status, last_latency_ms, last_error,
      server_info_json, tools_json, resources_json, last_synced_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      url = excluded.url,
      auth_type = excluded.auth_type,
      auth_header_name = excluded.auth_header_name,
      auth_token = excluded.auth_token,
      enabled = excluded.enabled,
      updated_at = excluded.updated_at
  `).run(
    id,
    input.name.trim(),
    input.url.trim(),
    input.authType || 'none',
    (input.authHeaderName || 'Authorization').trim(),
    finalToken,
    input.enabled === false ? 0 : 1,
    existing?.is_primary ? 1 : (input.isPrimary ? 1 : 0),
    existing?.last_status || 'pending',
    existing?.last_latency_ms || 0,
    existing?.last_error || '',
    existing?.server_info_json || '{}',
    existing?.tools_json || '[]',
    existing?.resources_json || '[]',
    existing?.last_synced_at || null,
    existing?.created_at || now,
    now
  );

  return getMcpServerByIdFromSqlite(id, false);
}

export function updateMcpDiscoveryInSqlite(
  id: string,
  payload: {
    lastStatus: string;
    lastLatencyMs: number;
    lastError?: string;
    serverInfo?: Record<string, any>;
    tools?: any[];
    resources?: any[];
  }
): void {
  const db = getStudioDb();
  if (!db) return;
  try {
    const now = new Date().toISOString();
    db.prepare(`
      UPDATE mcp_servers SET
        last_status = ?,
        last_latency_ms = ?,
        last_error = ?,
        server_info_json = COALESCE(?, server_info_json),
        tools_json = COALESCE(?, tools_json),
        resources_json = COALESCE(?, resources_json),
        last_synced_at = ?,
        updated_at = ?
      WHERE id = ?
    `).run(
      payload.lastStatus,
      payload.lastLatencyMs,
      payload.lastError || '',
      payload.serverInfo ? JSON.stringify(payload.serverInfo) : null,
      payload.tools ? JSON.stringify(payload.tools) : null,
      payload.resources ? JSON.stringify(payload.resources) : null,
      now,
      now,
      id
    );
  } catch (err) {
    console.warn('[SQLite MCP] Update discovery warning:', err);
  }
}

export function deleteMcpServerFromSqlite(id: string): boolean {
  const db = getStudioDb();
  if (!db || id === 'brickos-primary-mcp') return false;
  try {
    db.prepare('DELETE FROM mcp_servers WHERE id = ?').run(id);
    return true;
  } catch {
    return false;
  }
}

export interface McpPinnedWidgetRecord {
  id: string;
  serverId: string;
  toolName: string;
  title: string;
  args: Record<string, any>;
  lastResult: any;
  lastRunAt: string | null;
  createdAt: string;
}

export function listMcpPinnedWidgets(): McpPinnedWidgetRecord[] {
  const db = getStudioDb();
  if (!db) return [];
  try {
    const rows = db.prepare('SELECT * FROM mcp_pinned_widgets ORDER BY created_at DESC').all() as any[];
    return rows.map((r) => {
      let args: Record<string, any> = {};
      let lastResult: any = null;
      try { args = JSON.parse(r.args_json || '{}'); } catch {}
      try { lastResult = JSON.parse(r.last_result_json || 'null'); } catch {}
      return {
        id: r.id,
        serverId: r.server_id,
        toolName: r.tool_name,
        title: r.title,
        args,
        lastResult,
        lastRunAt: r.last_run_at || null,
        createdAt: r.created_at
      };
    });
  } catch {
    return [];
  }
}

export function upsertMcpPinnedWidget(input: {
  id?: string;
  serverId: string;
  toolName: string;
  title: string;
  args?: Record<string, any>;
  lastResult?: any;
}): McpPinnedWidgetRecord | null {
  const db = getStudioDb();
  if (!db) return null;
  try {
    const now = new Date().toISOString();
    const id = input.id || `pin-${crypto.randomBytes(5).toString('hex')}`;
    db.prepare(`
      INSERT INTO mcp_pinned_widgets (
        id, server_id, tool_name, title, args_json, last_result_json, last_run_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        args_json = excluded.args_json,
        last_result_json = excluded.last_result_json,
        last_run_at = excluded.last_run_at
    `).run(
      id,
      input.serverId,
      input.toolName,
      input.title,
      JSON.stringify(input.args || {}),
      JSON.stringify(input.lastResult ?? null),
      input.lastResult !== undefined ? now : null,
      now
    );
    return listMcpPinnedWidgets().find((w) => w.id === id) || null;
  } catch (err) {
    console.warn('[SQLite MCP] Pin widget warning:', err);
    return null;
  }
}

export function deleteMcpPinnedWidget(id: string): boolean {
  const db = getStudioDb();
  if (!db) return false;
  try {
    db.prepare('DELETE FROM mcp_pinned_widgets WHERE id = ?').run(id);
    return true;
  } catch {
    return false;
  }
}

export interface SocialOutletStatusRecord {
  trackId: string;
  outletKey: string;
  status: string;
  scheduledSlot: string;
  postUrl: string;
  postId: string;
  cohort: string;
  playlistId: string;
  notes: string;
  updatedAt: string;
}

export function listSocialOutletStatuses(): SocialOutletStatusRecord[] {
  const db = getStudioDb();
  if (!db) return [];
  try {
    const rows = db.prepare('SELECT * FROM social_outlet_statuses ORDER BY updated_at DESC').all() as any[];
    return rows.map((r) => ({
      trackId: r.track_id,
      outletKey: r.outlet_key,
      status: r.status,
      scheduledSlot: r.scheduled_slot || '',
      postUrl: r.post_url || '',
      postId: r.post_id || '',
      cohort: r.cohort || 'Cohort C',
      playlistId: r.playlist_id || '',
      notes: r.notes || '',
      updatedAt: r.updated_at
    }));
  } catch {
    return [];
  }
}

export function upsertSocialOutletStatus(input: {
  trackId: string;
  outletKey: string;
  status: string;
  scheduledSlot?: string;
  postUrl?: string;
  postId?: string;
  cohort?: string;
  playlistId?: string;
  notes?: string;
}): SocialOutletStatusRecord | null {
  const db = getStudioDb();
  if (!db) return null;
  try {
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO social_outlet_statuses (
        track_id, outlet_key, status, scheduled_slot, post_url, post_id, cohort, playlist_id, notes, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(track_id, outlet_key) DO UPDATE SET
        status = excluded.status,
        scheduled_slot = excluded.scheduled_slot,
        post_url = excluded.post_url,
        post_id = excluded.post_id,
        cohort = excluded.cohort,
        playlist_id = excluded.playlist_id,
        notes = excluded.notes,
        updated_at = excluded.updated_at
    `).run(
      input.trackId,
      input.outletKey,
      input.status,
      input.scheduledSlot || '',
      input.postUrl || '',
      input.postId || '',
      input.cohort || 'Cohort C',
      input.playlistId || '',
      input.notes || '',
      now
    );
    return {
      trackId: input.trackId,
      outletKey: input.outletKey,
      status: input.status,
      scheduledSlot: input.scheduledSlot || '',
      postUrl: input.postUrl || '',
      postId: input.postId || '',
      cohort: input.cohort || 'Cohort C',
      playlistId: input.playlistId || '',
      notes: input.notes || '',
      updatedAt: now
    };
  } catch (err) {
    console.warn('[SQLite Social Outlet] Upsert warning:', err);
    return null;
  }
}

export function getMcpTelemetryCache<T = any>(cacheKey: string): { payload: T; updatedAt: string } | null {
  const db = getStudioDb();
  if (!db) return null;
  try {
    const row = db.prepare('SELECT payload_json, updated_at FROM mcp_telemetry_cache WHERE cache_key = ?').get(cacheKey) as any;
    if (!row) return null;
    return {
      payload: JSON.parse(row.payload_json),
      updatedAt: row.updated_at
    };
  } catch {
    return null;
  }
}

export function setMcpTelemetryCache(cacheKey: string, payload: any): void {
  const db = getStudioDb();
  if (!db) return;
  try {
    db.prepare(`
      INSERT INTO mcp_telemetry_cache (cache_key, payload_json, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(cache_key) DO UPDATE SET
        payload_json = excluded.payload_json,
        updated_at = excluded.updated_at
    `).run(cacheKey, JSON.stringify(payload), new Date().toISOString());
  } catch {}
}


