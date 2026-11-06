import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
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
    // Dynamically require built-in node:sqlite (Node 22.5+)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { DatabaseSync } = require('node:sqlite');
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
    `);

    sqliteDb = db;
    seedDatabaseIfNeeded(db);
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
