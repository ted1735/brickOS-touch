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

      CREATE TABLE IF NOT EXISTS mcp_auth_profiles (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        auth_type TEXT NOT NULL DEFAULT 'bearer',
        header_name TEXT NOT NULL DEFAULT 'Authorization',
        encrypted_secret TEXT DEFAULT '',
        env_var_name TEXT DEFAULT '',
        token_preview TEXT DEFAULT '',
        description TEXT DEFAULT '',
        last_verified_at TEXT,
        last_verified_status INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS mcp_servers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        auth_type TEXT DEFAULT 'none',
        auth_header_name TEXT DEFAULT 'Authorization',
        auth_token TEXT DEFAULT '',
        auth_profile_id TEXT DEFAULT '',
        encrypted_secret TEXT DEFAULT '',
        consecutive_failures INTEGER DEFAULT 0,
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

      CREATE TABLE IF NOT EXISTS short_metadata_overrides (
        short_id TEXT PRIMARY KEY,
        track_slug TEXT DEFAULT '',
        track_title TEXT DEFAULT '',
        campaign TEXT DEFAULT '',
        status TEXT DEFAULT '',
        title TEXT DEFAULT '',
        hook_text TEXT DEFAULT '',
        caption TEXT DEFAULT '',
        scheduled_slot TEXT DEFAULT '',
        playlist_id TEXT DEFAULT '',
        youtube_id TEXT DEFAULT '',
        youtube_url TEXT DEFAULT '',
        spotify_url TEXT DEFAULT '',
        apple_music_url TEXT DEFAULT '',
        youtube_music_url TEXT DEFAULT '',
        canonical_master_file TEXT DEFAULT '',
        video_asset_url TEXT DEFAULT '',
        thumbnail_asset_url TEXT DEFAULT '',
        notes TEXT DEFAULT '',
        last_synced_at TEXT,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS matrix_track_preferences (
        track_id TEXT PRIMARY KEY,
        active_override TEXT NOT NULL DEFAULT 'auto',
        needs_action_override TEXT NOT NULL DEFAULT 'auto',
        action_note TEXT DEFAULT '',
        manual_rank INTEGER NOT NULL DEFAULT 9999,
        updated_at TEXT NOT NULL
      );
    `);

    // Migrate existing mcp_servers databases cleanly if columns were added in this upgrade
    const serverCols = (db.prepare('PRAGMA table_info(mcp_servers)').all() as any[]).map((c) => c.name);
    if (!serverCols.includes('auth_profile_id')) {
      db.exec(`ALTER TABLE mcp_servers ADD COLUMN auth_profile_id TEXT DEFAULT ''`);
    }
    if (!serverCols.includes('encrypted_secret')) {
      db.exec(`ALTER TABLE mcp_servers ADD COLUMN encrypted_secret TEXT DEFAULT ''`);
    }
    if (!serverCols.includes('consecutive_failures')) {
      db.exec(`ALTER TABLE mcp_servers ADD COLUMN consecutive_failures INTEGER DEFAULT 0`);
    }

    sqliteDb = db;
    seedDatabaseIfNeeded(db);
    migrateLegacyPlaintextMcpTokens(db);
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

// ==========================================
// ENCRYPTED MCP CREDENTIAL VAULT & AUTH PROFILES
// ==========================================

function getVaultMasterKey(dbInstance?: any): Buffer {
  const envSecret = process.env.BRICKOS_VAULT_SECRET;
  if (envSecret && envSecret.trim().length >= 8) {
    return crypto.scryptSync(envSecret.trim(), 'brickos-mcp-vault-v1', 32);
  }
  const db = dbInstance || sqliteDb;
  let instanceSeed = '';
  if (db) {
    try {
      const row = db.prepare(`SELECT value FROM server_kv_state WHERE key = 'mcp_vault_seed_v1'`).get() as { value?: string } | undefined;
      if (row?.value) {
        instanceSeed = row.value;
      } else {
        instanceSeed = crypto.randomBytes(32).toString('hex');
        db.prepare(`
          INSERT INTO server_kv_state (key, value, updated_at)
          VALUES ('mcp_vault_seed_v1', ?, ?)
          ON CONFLICT(key) DO NOTHING
        `).run(instanceSeed, new Date().toISOString());
      }
    } catch {}
  }
  const seedMaterial = instanceSeed || `${process.cwd()}::brickos-studio-local-vault`;
  return crypto.scryptSync(seedMaterial, 'brickos-mcp-vault-v1', 32);
}

export function encryptMcpSecret(plainText: string, dbInstance?: any): string {
  const clean = String(plainText || '').trim();
  if (!clean) return '';
  const key = getVaultMasterKey(dbInstance);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(clean, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decryptMcpSecret(payload: string, dbInstance?: any): string {
  const raw = String(payload || '').trim();
  if (!raw) return '';
  if (!raw.startsWith('v1:')) return raw; // Fallback for unencrypted legacy strings
  try {
    const [, ivHex, tagHex, cipherHex] = raw.split(':');
    if (!ivHex || !tagHex || !cipherHex) return '';
    const key = getVaultMasterKey(dbInstance);
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    const plain = Buffer.concat([
      decipher.update(Buffer.from(cipherHex, 'hex')),
      decipher.final()
    ]);
    return plain.toString('utf8');
  } catch {
    return '';
  }
}

export function formatTokenPreview(secret: string): string {
  const clean = String(secret || '').replace(/^Bearer\s+/i, '').trim();
  if (!clean) return '';
  if (clean.length <= 4) return '••••';
  return `••••${clean.slice(-4)}`;
}

function migrateLegacyPlaintextMcpTokens(dbInstance: any): void {
  try {
    const rows = dbInstance
      .prepare(`SELECT id, auth_token, encrypted_secret FROM mcp_servers WHERE auth_token IS NOT NULL AND auth_token != ''`)
      .all() as any[];
    for (const r of rows) {
      const encrypted = r.encrypted_secret || encryptMcpSecret(r.auth_token, dbInstance);
      dbInstance
        .prepare(`UPDATE mcp_servers SET encrypted_secret = ?, auth_token = '' WHERE id = ?`)
        .run(encrypted, r.id);
    }
  } catch (err) {
    console.warn('[SQLite MCP] Legacy token migration notice:', err);
  }
}

export interface StoredMcpAuthProfile {
  id: string;
  name: string;
  authType: 'bearer' | 'header' | 'env_bearer';
  headerName: string;
  envVarName: string;
  secret: string;
  hasSecret: boolean;
  tokenPreview: string;
  description: string;
  lastVerifiedAt: string | null;
  lastVerifiedStatus: number;
  linkedServerCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface StoredMcpServerRecord {
  id: string;
  name: string;
  url: string;
  authType: 'none' | 'bearer' | 'header' | 'profile';
  authHeaderName: string;
  authToken: string;
  authProfileId: string;
  authProfileName: string;
  tokenPreview: string;
  hasAuthToken: boolean;
  enabled: boolean;
  isPrimary: boolean;
  lastStatus: string;
  lastLatencyMs: number;
  lastError: string;
  consecutiveFailures: number;
  serverInfo: Record<string, any>;
  tools: any[];
  resources: any[];
  lastSyncedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

function mapMcpAuthProfileRow(r: any, includeSecret = false, linkedCount = 0): StoredMcpAuthProfile {
  const decrypted = r.encrypted_secret ? decryptMcpSecret(r.encrypted_secret) : '';
  const envVal = r.auth_type === 'env_bearer' && r.env_var_name ? String(process.env[r.env_var_name] || '') : '';
  const effectiveSecret = r.auth_type === 'env_bearer' ? envVal : decrypted;
  const hasSecret = effectiveSecret.length > 0;
  return {
    id: r.id,
    name: r.name,
    authType: (r.auth_type || 'bearer') as 'bearer' | 'header' | 'env_bearer',
    headerName: r.header_name || 'Authorization',
    envVarName: r.env_var_name || '',
    secret: includeSecret ? effectiveSecret : (hasSecret ? '••••••••' : ''),
    hasSecret,
    tokenPreview: r.token_preview || formatTokenPreview(effectiveSecret),
    description: r.description || '',
    lastVerifiedAt: r.last_verified_at || null,
    lastVerifiedStatus: Number(r.last_verified_status || 0),
    linkedServerCount: linkedCount,
    createdAt: r.created_at,
    updatedAt: r.updated_at
  };
}

export function listMcpAuthProfilesFromSqlite(includeSecrets = false): StoredMcpAuthProfile[] {
  const db = getStudioDb();
  if (!db) return [];
  try {
    const rows = db.prepare('SELECT * FROM mcp_auth_profiles ORDER BY created_at DESC').all() as any[];
    const linkRows = db
      .prepare(`SELECT auth_profile_id, COUNT(*) as cnt FROM mcp_servers WHERE auth_profile_id != '' GROUP BY auth_profile_id`)
      .all() as any[];
    const linkMap = new Map<string, number>(linkRows.map((l) => [l.auth_profile_id, Number(l.cnt || 0)]));
    return rows.map((r) => mapMcpAuthProfileRow(r, includeSecrets, linkMap.get(r.id) || 0));
  } catch {
    return [];
  }
}

export function getMcpAuthProfileByIdFromSqlite(id: string, includeSecret = true): StoredMcpAuthProfile | null {
  const db = getStudioDb();
  if (!db || !id) return null;
  try {
    const row = db.prepare('SELECT * FROM mcp_auth_profiles WHERE id = ?').get(id) as any;
    return row ? mapMcpAuthProfileRow(row, includeSecret) : null;
  } catch {
    return null;
  }
}

export function upsertMcpAuthProfileInSqlite(input: {
  id?: string;
  name: string;
  authType?: 'bearer' | 'header' | 'env_bearer';
  headerName?: string;
  secret?: string;
  envVarName?: string;
  description?: string;
  clearSecret?: boolean;
}): StoredMcpAuthProfile | null {
  const db = getStudioDb();
  if (!db) return null;
  const now = new Date().toISOString();
  const id = (input.id && input.id.trim()) || `auth-${crypto.randomBytes(5).toString('hex')}`;
  const existing = db.prepare('SELECT * FROM mcp_auth_profiles WHERE id = ?').get(id) as any;
  const authType = input.authType || existing?.auth_type || 'bearer';

  let encryptedSecret = existing?.encrypted_secret || '';
  let tokenPreview = existing?.token_preview || '';
  if (input.clearSecret || authType === 'env_bearer') {
    encryptedSecret = '';
    tokenPreview = authType === 'env_bearer' ? `env:${input.envVarName || existing?.env_var_name || 'MCP_TOKEN'}` : '';
  } else if (typeof input.secret === 'string' && input.secret.trim() !== '' && input.secret.trim() !== '••••••••') {
    const clean = input.secret.trim().replace(/^Bearer\s+/i, '');
    encryptedSecret = encryptMcpSecret(clean, db);
    tokenPreview = formatTokenPreview(clean);
  }

  db.prepare(`
    INSERT INTO mcp_auth_profiles (
      id, name, auth_type, header_name, encrypted_secret, env_var_name,
      token_preview, description, last_verified_at, last_verified_status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      auth_type = excluded.auth_type,
      header_name = excluded.header_name,
      encrypted_secret = excluded.encrypted_secret,
      env_var_name = excluded.env_var_name,
      token_preview = excluded.token_preview,
      description = excluded.description,
      updated_at = excluded.updated_at
  `).run(
    id,
    input.name.trim(),
    authType,
    (authType === 'header' ? (input.headerName || 'X-API-Key') : 'Authorization').trim(),
    encryptedSecret,
    (input.envVarName || '').trim(),
    tokenPreview,
    (input.description || '').trim(),
    existing?.last_verified_at || null,
    existing?.last_verified_status || 0,
    existing?.created_at || now,
    now
  );

  return getMcpAuthProfileByIdFromSqlite(id, false);
}

export function updateMcpAuthProfileVerification(id: string, httpStatus: number): void {
  const db = getStudioDb();
  if (!db || !id) return;
  try {
    db.prepare(`UPDATE mcp_auth_profiles SET last_verified_at = ?, last_verified_status = ? WHERE id = ?`).run(
      new Date().toISOString(),
      httpStatus,
      id
    );
  } catch {}
}

export function deleteMcpAuthProfileFromSqlite(id: string): boolean {
  const db = getStudioDb();
  if (!db || !id) return false;
  try {
    db.prepare(`UPDATE mcp_servers SET auth_profile_id = '', auth_type = CASE WHEN auth_type = 'profile' THEN 'none' ELSE auth_type END WHERE auth_profile_id = ?`).run(id);
    db.prepare('DELETE FROM mcp_auth_profiles WHERE id = ?').run(id);
    return true;
  } catch {
    return false;
  }
}

export function resolveEffectiveMcpAuth(server: StoredMcpServerRecord): {
  mode: 'none' | 'bearer' | 'header';
  headerName: string;
  secret: string;
  source: 'profile' | 'env' | 'inline' | 'none';
  profileName?: string;
} {
  if (server.authProfileId) {
    const profile = getMcpAuthProfileByIdFromSqlite(server.authProfileId, true);
    if (profile && profile.secret) {
      return {
        mode: profile.authType === 'header' ? 'header' : 'bearer',
        headerName: profile.authType === 'header' ? profile.headerName : 'Authorization',
        secret: profile.secret,
        source: profile.authType === 'env_bearer' ? 'env' : 'profile',
        profileName: profile.name
      };
    }
  }
  if ((server.authType === 'bearer' || server.authType === 'header') && server.authToken) {
    return {
      mode: server.authType,
      headerName: server.authType === 'header' ? (server.authHeaderName || 'X-API-Key') : 'Authorization',
      secret: server.authToken,
      source: 'inline'
    };
  }
  return { mode: 'none', headerName: 'Authorization', secret: '', source: 'none' };
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
          id, name, url, auth_type, auth_header_name, auth_token, auth_profile_id, encrypted_secret,
          consecutive_failures, enabled, is_primary, last_status, last_latency_ms, last_error,
          server_info_json, tools_json, resources_json, last_synced_at, created_at, updated_at
        ) VALUES (?, ?, ?, 'none', 'Authorization', '', '', '', 0, 1, 1, 'ready', 0, '', '{}', '[]', '[]', NULL, ?, ?)
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

  const decryptedInline = r.encrypted_secret
    ? decryptMcpSecret(r.encrypted_secret)
    : String(r.auth_token || '');
  const linkedProfile = r.auth_profile_id ? getMcpAuthProfileByIdFromSqlite(r.auth_profile_id, includeSecrets) : null;
  const hasInlineSecret = decryptedInline.length > 0;
  const hasAnyToken = hasInlineSecret || Boolean(linkedProfile?.hasSecret);
  const preview = linkedProfile?.tokenPreview || formatTokenPreview(decryptedInline);

  return {
    id: r.id,
    name: r.name,
    url: r.url,
    authType: (r.auth_type || 'none') as 'none' | 'bearer' | 'header' | 'profile',
    authHeaderName: r.auth_header_name || 'Authorization',
    authToken: includeSecrets ? decryptedInline : (hasInlineSecret ? '••••••••' : ''),
    authProfileId: r.auth_profile_id || '',
    authProfileName: linkedProfile?.name || '',
    tokenPreview: preview,
    hasAuthToken: hasAnyToken,
    enabled: Boolean(r.enabled),
    isPrimary: Boolean(r.is_primary),
    lastStatus: r.last_status || 'pending',
    lastLatencyMs: Number(r.last_latency_ms || 0),
    lastError: r.last_error || '',
    consecutiveFailures: Number(r.consecutive_failures || 0),
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
  authType?: 'none' | 'bearer' | 'header' | 'profile';
  authHeaderName?: string;
  authToken?: string;
  authProfileId?: string;
  clearAuthToken?: boolean;
  enabled?: boolean;
  isPrimary?: boolean;
}): StoredMcpServerRecord | null {
  const db = getStudioDb();
  if (!db) return null;
  ensureDefaultMcpServer(db);
  const now = new Date().toISOString();
  const id = (input.id && input.id.trim()) || `mcp-${crypto.randomBytes(5).toString('hex')}`;
  const existing = db.prepare('SELECT * FROM mcp_servers WHERE id = ?').get(id) as any;

  const authType = input.authType || 'none';
  const authProfileId = authType === 'profile' ? (input.authProfileId || '').trim() : '';

  let encryptedSecret = existing?.encrypted_secret || '';
  if (input.clearAuthToken || authType === 'none' || authType === 'profile') {
    encryptedSecret = '';
  } else if (typeof input.authToken === 'string' && input.authToken.trim() !== '' && input.authToken.trim() !== '••••••••') {
    const clean = authType === 'bearer'
      ? input.authToken.trim().replace(/^Bearer\s+/i, '')
      : input.authToken.trim();
    encryptedSecret = encryptMcpSecret(clean, db);
  }

  db.prepare(`
    INSERT INTO mcp_servers (
      id, name, url, auth_type, auth_header_name, auth_token, auth_profile_id, encrypted_secret,
      consecutive_failures, enabled, is_primary, last_status, last_latency_ms, last_error,
      server_info_json, tools_json, resources_json, last_synced_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, '', ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      url = excluded.url,
      auth_type = excluded.auth_type,
      auth_header_name = excluded.auth_header_name,
      auth_token = '',
      auth_profile_id = excluded.auth_profile_id,
      encrypted_secret = excluded.encrypted_secret,
      enabled = excluded.enabled,
      updated_at = excluded.updated_at
  `).run(
    id,
    input.name.trim(),
    input.url.trim(),
    authType,
    (input.authHeaderName || 'Authorization').trim(),
    authProfileId,
    encryptedSecret,
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
    const isErr = payload.lastStatus === 'error';
    db.prepare(`
      UPDATE mcp_servers SET
        last_status = ?,
        last_latency_ms = ?,
        last_error = ?,
        consecutive_failures = CASE WHEN ? = 1 THEN consecutive_failures + 1 ELSE 0 END,
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
      isErr ? 1 : 0,
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

export interface ShortMetadataOverrideRecord {
  shortId: string;
  trackSlug: string;
  trackTitle: string;
  campaign: string;
  status: string;
  title: string;
  hookText: string;
  caption: string;
  scheduledSlot: string;
  playlistId: string;
  youtubeId: string;
  youtubeUrl: string;
  spotifyUrl: string;
  appleMusicUrl: string;
  youtubeMusicUrl: string;
  canonicalMasterFile: string;
  videoAssetUrl: string;
  thumbnailAssetUrl: string;
  notes: string;
  lastSyncedAt: string | null;
  updatedAt: string;
}

export function listShortMetadataOverrides(): ShortMetadataOverrideRecord[] {
  const db = getStudioDb();
  if (!db) return [];
  try {
    const rows = db.prepare('SELECT * FROM short_metadata_overrides ORDER BY updated_at DESC').all() as any[];
    return rows.map((r) => ({
      shortId: r.short_id,
      trackSlug: r.track_slug || '',
      trackTitle: r.track_title || '',
      campaign: r.campaign || '',
      status: r.status || '',
      title: r.title || '',
      hookText: r.hook_text || '',
      caption: r.caption || '',
      scheduledSlot: r.scheduled_slot || '',
      playlistId: r.playlist_id || '',
      youtubeId: r.youtube_id || '',
      youtubeUrl: r.youtube_url || '',
      spotifyUrl: r.spotify_url || '',
      appleMusicUrl: r.apple_music_url || '',
      youtubeMusicUrl: r.youtube_music_url || '',
      canonicalMasterFile: r.canonical_master_file || '',
      videoAssetUrl: r.video_asset_url || '',
      thumbnailAssetUrl: r.thumbnail_asset_url || '',
      notes: r.notes || '',
      lastSyncedAt: r.last_synced_at || null,
      updatedAt: r.updated_at
    }));
  } catch {
    return [];
  }
}

export function upsertShortMetadataOverride(input: {
  shortId: string;
  trackSlug?: string;
  trackTitle?: string;
  campaign?: string;
  status?: string;
  title?: string;
  hookText?: string;
  caption?: string;
  scheduledSlot?: string;
  playlistId?: string;
  youtubeId?: string;
  youtubeUrl?: string;
  spotifyUrl?: string;
  appleMusicUrl?: string;
  youtubeMusicUrl?: string;
  canonicalMasterFile?: string;
  videoAssetUrl?: string;
  thumbnailAssetUrl?: string;
  notes?: string;
  markSynced?: boolean;
}): ShortMetadataOverrideRecord | null {
  const db = getStudioDb();
  if (!db || !input.shortId) return null;
  try {
    const now = new Date().toISOString();
    const existing = db.prepare('SELECT * FROM short_metadata_overrides WHERE short_id = ?').get(input.shortId) as any;
    const lastSyncedAt = input.markSynced ? now : (existing?.last_synced_at || null);
    db.prepare(`
      INSERT INTO short_metadata_overrides (
        short_id, track_slug, track_title, campaign, status, title, hook_text, caption,
        scheduled_slot, playlist_id, youtube_id, youtube_url, spotify_url, apple_music_url,
        youtube_music_url, canonical_master_file, video_asset_url, thumbnail_asset_url,
        notes, last_synced_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(short_id) DO UPDATE SET
        track_slug = excluded.track_slug,
        track_title = excluded.track_title,
        campaign = excluded.campaign,
        status = excluded.status,
        title = excluded.title,
        hook_text = excluded.hook_text,
        caption = excluded.caption,
        scheduled_slot = excluded.scheduled_slot,
        playlist_id = excluded.playlist_id,
        youtube_id = excluded.youtube_id,
        youtube_url = excluded.youtube_url,
        spotify_url = excluded.spotify_url,
        apple_music_url = excluded.apple_music_url,
        youtube_music_url = excluded.youtube_music_url,
        canonical_master_file = excluded.canonical_master_file,
        video_asset_url = excluded.video_asset_url,
        thumbnail_asset_url = excluded.thumbnail_asset_url,
        notes = excluded.notes,
        last_synced_at = excluded.last_synced_at,
        updated_at = excluded.updated_at
    `).run(
      input.shortId,
      input.trackSlug ?? existing?.track_slug ?? '',
      input.trackTitle ?? existing?.track_title ?? '',
      input.campaign ?? existing?.campaign ?? '',
      input.status ?? existing?.status ?? '',
      input.title ?? existing?.title ?? '',
      input.hookText ?? existing?.hook_text ?? '',
      input.caption ?? existing?.caption ?? '',
      input.scheduledSlot ?? existing?.scheduled_slot ?? '',
      input.playlistId ?? existing?.playlist_id ?? '',
      input.youtubeId ?? existing?.youtube_id ?? '',
      input.youtubeUrl ?? existing?.youtube_url ?? '',
      input.spotifyUrl ?? existing?.spotify_url ?? '',
      input.appleMusicUrl ?? existing?.apple_music_url ?? '',
      input.youtubeMusicUrl ?? existing?.youtube_music_url ?? '',
      input.canonicalMasterFile ?? existing?.canonical_master_file ?? '',
      input.videoAssetUrl ?? existing?.video_asset_url ?? '',
      input.thumbnailAssetUrl ?? existing?.thumbnail_asset_url ?? '',
      input.notes ?? existing?.notes ?? '',
      lastSyncedAt,
      now
    );
    return listShortMetadataOverrides().find((o) => o.shortId === input.shortId) || null;
  } catch (err) {
    console.warn('[SQLite Short Override] Upsert warning:', err);
    return null;
  }
}

export interface MatrixTrackPreferenceRecord {
  trackId: string;
  activeOverride: 'auto' | 'pinned' | 'archived';
  needsActionOverride: 'auto' | 'flagged' | 'cleared';
  actionNote: string;
  manualRank: number;
  updatedAt: string;
}

const VALID_ACTIVE_OVERRIDES = new Set(['auto', 'pinned', 'archived']);
const VALID_ACTION_OVERRIDES = new Set(['auto', 'flagged', 'cleared']);
const VALID_SORT_MODES = new Set(['manual', 'date_desc', 'date_asc', 'completion_desc', 'completion_asc']);
const MATRIX_SORT_MODE_KEY = 'brickos_matrix_sort_mode_v1';

export function getMatrixSortModeFromSqlite(): 'manual' | 'date_desc' | 'date_asc' | 'completion_desc' | 'completion_asc' {
  const db = getStudioDb();
  if (!db) return 'manual';
  try {
    const row = db.prepare('SELECT value FROM server_kv_state WHERE key = ?').get(MATRIX_SORT_MODE_KEY) as any;
    const val = row?.value;
    return VALID_SORT_MODES.has(val) ? val : 'manual';
  } catch {
    return 'manual';
  }
}

export function setMatrixSortModeInSqlite(sortMode: string): 'manual' | 'date_desc' | 'date_asc' | 'completion_desc' | 'completion_asc' {
  const safe = VALID_SORT_MODES.has(sortMode) ? (sortMode as any) : 'manual';
  const db = getStudioDb();
  if (!db) return safe;
  try {
    db.prepare(`
      INSERT INTO server_kv_state (key, value, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        updated_at = excluded.updated_at
    `).run(MATRIX_SORT_MODE_KEY, safe, new Date().toISOString());
  } catch {}
  return safe;
}

export function listMatrixTrackPreferences(): MatrixTrackPreferenceRecord[] {
  const db = getStudioDb();
  if (!db) return [];
  try {
    const rows = db.prepare('SELECT * FROM matrix_track_preferences ORDER BY manual_rank ASC, updated_at DESC').all() as any[];
    return rows.map((r) => ({
      trackId: r.track_id,
      activeOverride: VALID_ACTIVE_OVERRIDES.has(r.active_override) ? r.active_override : 'auto',
      needsActionOverride: VALID_ACTION_OVERRIDES.has(r.needs_action_override) ? r.needs_action_override : 'auto',
      actionNote: r.action_note || '',
      manualRank: typeof r.manual_rank === 'number' ? r.manual_rank : 9999,
      updatedAt: r.updated_at
    }));
  } catch {
    return [];
  }
}

export function upsertMatrixTrackPreference(input: {
  trackId: string;
  activeOverride?: 'auto' | 'pinned' | 'archived';
  needsActionOverride?: 'auto' | 'flagged' | 'cleared';
  actionNote?: string;
  manualRank?: number;
}): MatrixTrackPreferenceRecord | null {
  const db = getStudioDb();
  if (!db || !input.trackId) return null;
  try {
    const now = new Date().toISOString();
    const existing = db.prepare('SELECT * FROM matrix_track_preferences WHERE track_id = ?').get(input.trackId) as any;
    const activeOverride =
      input.activeOverride && VALID_ACTIVE_OVERRIDES.has(input.activeOverride)
        ? input.activeOverride
        : existing?.active_override || 'auto';
    const needsActionOverride =
      input.needsActionOverride && VALID_ACTION_OVERRIDES.has(input.needsActionOverride)
        ? input.needsActionOverride
        : existing?.needs_action_override || 'auto';
    const actionNote =
      input.actionNote !== undefined ? String(input.actionNote) : existing?.action_note || '';
    const manualRank =
      typeof input.manualRank === 'number' && Number.isFinite(input.manualRank)
        ? Math.round(input.manualRank)
        : typeof existing?.manual_rank === 'number'
        ? existing.manual_rank
        : 9999;

    db.prepare(`
      INSERT INTO matrix_track_preferences (
        track_id, active_override, needs_action_override, action_note, manual_rank, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(track_id) DO UPDATE SET
        active_override = excluded.active_override,
        needs_action_override = excluded.needs_action_override,
        action_note = excluded.action_note,
        manual_rank = excluded.manual_rank,
        updated_at = excluded.updated_at
    `).run(input.trackId, activeOverride, needsActionOverride, actionNote, manualRank, now);

    return listMatrixTrackPreferences().find((p) => p.trackId === input.trackId) || null;
  } catch (err) {
    console.warn('[SQLite Matrix Pref] Upsert warning:', err);
    return null;
  }
}

export function bulkSaveMatrixTrackPreferences(
  updates: Array<{
    trackId: string;
    activeOverride?: 'auto' | 'pinned' | 'archived';
    needsActionOverride?: 'auto' | 'flagged' | 'cleared';
    actionNote?: string;
    manualRank?: number;
  }>,
  resetAllToAuto = false
): MatrixTrackPreferenceRecord[] {
  const db = getStudioDb();
  if (!db) return [];
  try {
    db.exec('BEGIN TRANSACTION');
    if (resetAllToAuto) {
      db.prepare(`
        UPDATE matrix_track_preferences
        SET active_override = 'auto', needs_action_override = 'auto', action_note = '', updated_at = ?
      `).run(new Date().toISOString());
    } else {
      for (const item of updates) {
        if (item?.trackId) upsertMatrixTrackPreference(item);
      }
    }
    db.exec('COMMIT');
  } catch (err) {
    try { db.exec('ROLLBACK'); } catch {}
    console.warn('[SQLite Matrix Pref] Bulk save warning:', err);
  }
  return listMatrixTrackPreferences();
}

export function saveMatrixSortOrderInSqlite(orderedTrackIds: string[]): MatrixTrackPreferenceRecord[] {
  const db = getStudioDb();
  if (!db) return [];
  const now = new Date().toISOString();
  try {
    db.exec('BEGIN TRANSACTION');
    orderedTrackIds.forEach((trackId, index) => {
      if (!trackId) return;
      const existing = db.prepare('SELECT * FROM matrix_track_preferences WHERE track_id = ?').get(trackId) as any;
      db.prepare(`
        INSERT INTO matrix_track_preferences (
          track_id, active_override, needs_action_override, action_note, manual_rank, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(track_id) DO UPDATE SET
          manual_rank = excluded.manual_rank,
          updated_at = excluded.updated_at
      `).run(
        trackId,
        existing?.active_override || 'auto',
        existing?.needs_action_override || 'auto',
        existing?.action_note || '',
        index,
        now
      );
    });
    db.exec('COMMIT');
    setMatrixSortModeInSqlite('manual');
  } catch (err) {
    try { db.exec('ROLLBACK'); } catch {}
    console.warn('[SQLite Matrix Order] Save warning:', err);
  }
  return listMatrixTrackPreferences();
}
