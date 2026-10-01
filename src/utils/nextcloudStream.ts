import { NextcloudSyncConfig } from '../types';

export const DEFAULT_NEXTCLOUD_CONFIG: NextcloudSyncConfig = {
  serverUrl: 'https://nextcloud.moyercloud.com',
  username: 'ncted',
  webdavRoot: 'https://nextcloud.moyercloud.com/remote.php/dav/files/ncted/Music-Production',
  folderIdOrShareUrl: 'https://nextcloud.moyercloud.com/index.php/apps/files/files/207332?dir=/Music-Production',
  lastConnectionStatus: 'idle',
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

/**
 * Universal Nextcloud WebDAV Stream URL builder
 * Automatically injects active server credentials from localStorage config
 * so streaming authenticated media from Nextcloud succeeds seamlessly.
 */
export function buildNextcloudStreamUrl(webdavPath: string): string {
  if (!webdavPath) return '';
  const cleanPath = webdavPath.startsWith('/') ? webdavPath : '/' + webdavPath;
  const cfg = getSavedNextcloudConfig();
  let url = `/api/nextcloud/stream?path=${encodeURIComponent(cleanPath)}`;
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
