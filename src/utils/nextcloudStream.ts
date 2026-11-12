import { NextcloudSyncConfig } from '../types';

export const NEXTCLOUD_PRIMARY_SERVER_URL = 'https://nextcloud.mermaid-symmetric.ts.net';
export const NEXTCLOUD_FALLBACK_SERVER_URL = 'https://nextcloud.moyercloud.com';

export const DEFAULT_NEXTCLOUD_CONFIG: NextcloudSyncConfig = {
  serverUrl: NEXTCLOUD_PRIMARY_SERVER_URL,
  fallbackServerUrl: NEXTCLOUD_FALLBACK_SERVER_URL,
  activeRoute: 'primary',
  username: 'ncted',
  webdavRoot: `${NEXTCLOUD_PRIMARY_SERVER_URL}/remote.php/dav/files/ncted/Music-Production`,
  folderIdOrShareUrl: `${NEXTCLOUD_PRIMARY_SERVER_URL}/index.php/apps/files/files/207332?dir=/Music-Production`,
  lastConnectionStatus: 'idle',
  isPushConnected: false,
};

export const LOCAL_STORAGE_NC_CONFIG_KEY = 'brickos_nextcloud_sync_config';

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

export interface StreamUrlMeta {
  trackId?: string;
  trackTitle?: string;
  stemType?: string;
}

const RELINKED_STEMS_STORAGE_KEY = 'brickos_relinked_stems_v1';

export interface RelinkedStemEntry {
  trackId: string;
  channelId?: number;
  stemType?: string;
  webdavPath?: string;
  directUrl?: string;
  updatedAt: string;
}

export function getRelinkedStemOverride(
  trackId?: string,
  channelId?: number,
  stemType?: string
): RelinkedStemEntry | null {
  if (typeof window === 'undefined' || !trackId) return null;
  try {
    const raw = localStorage.getItem(RELINKED_STEMS_STORAGE_KEY);
    if (!raw) return null;
    const map: Record<string, RelinkedStemEntry> = JSON.parse(raw);
    if (channelId !== undefined && map[`${trackId}::ch:${channelId}`]) {
      return map[`${trackId}::ch:${channelId}`];
    }
    if (stemType && map[`${trackId}::stem:${stemType.toLowerCase()}`]) {
      return map[`${trackId}::stem:${stemType.toLowerCase()}`];
    }
    if (map[`${trackId}::master`]) {
      return map[`${trackId}::master`];
    }
  } catch {
    // ignore storage errors
  }
  return null;
}

export function saveRelinkedStemOverride(entry: Omit<RelinkedStemEntry, 'updatedAt'>): void {
  if (typeof window === 'undefined' || !entry.trackId) return;
  try {
    const raw = localStorage.getItem(RELINKED_STEMS_STORAGE_KEY);
    const map: Record<string, RelinkedStemEntry> = raw ? JSON.parse(raw) : {};
    const stamped: RelinkedStemEntry = { ...entry, updatedAt: new Date().toISOString() };
    if (entry.channelId !== undefined) {
      map[`${entry.trackId}::ch:${entry.channelId}`] = stamped;
    }
    if (entry.stemType) {
      map[`${entry.trackId}::stem:${entry.stemType.toLowerCase()}`] = stamped;
    }
    if (entry.channelId === undefined && !entry.stemType) {
      map[`${entry.trackId}::master`] = stamped;
    }
    localStorage.setItem(RELINKED_STEMS_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore storage errors
  }
}

/**
 * Universal Nextcloud WebDAV Stream URL builder
 * Automatically injects active server credentials & canonical track metadata
 * so streaming authenticated media or exact-track fallback from Nextcloud succeeds seamlessly.
 */
export function buildNextcloudStreamUrl(webdavPath: string, meta?: StreamUrlMeta): string {
  if (!webdavPath) return '';
  if (webdavPath.startsWith('http://') || webdavPath.startsWith('https://')) {
    return webdavPath;
  }
  const cleanPath = webdavPath.startsWith('/') ? webdavPath : '/' + webdavPath;
  const cfg = getSavedNextcloudConfig();
  let url = `/api/nextcloud/stream?path=${encodeURIComponent(cleanPath)}`;
  if (meta?.trackId) {
    url += `&trackId=${encodeURIComponent(meta.trackId)}`;
  }
  if (meta?.trackTitle) {
    url += `&title=${encodeURIComponent(meta.trackTitle)}`;
  }
  if (meta?.stemType) {
    url += `&stemType=${encodeURIComponent(meta.stemType)}`;
  }
  if (cfg.appPassword && cfg.appPassword.trim().length > 0) {
    url += `&password=${encodeURIComponent(cfg.appPassword.trim())}`;
  }
  if (cfg.username && cfg.username.trim().length > 0) {
    url += `&username=${encodeURIComponent(cfg.username.trim())}`;
  }
  if (cfg.serverUrl && cfg.serverUrl.trim().length > 0) {
    url += `&serverUrl=${encodeURIComponent(cfg.serverUrl.trim())}`;
  }
  return url;
}
