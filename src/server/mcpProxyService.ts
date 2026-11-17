import { fetch as undiciFetch } from 'undici';
import {
  listMcpServersFromSqlite,
  getMcpServerByIdFromSqlite,
  updateMcpDiscoveryInSqlite,
  listMcpPinnedWidgets,
  upsertMcpPinnedWidget,
  listSocialOutletStatuses,
  getMcpTelemetryCache,
  setMcpTelemetryCache,
  getServerKvState,
  setServerKvState,
  listMcpAuthProfilesFromSqlite,
  getMcpAuthProfileByIdFromSqlite,
  updateMcpAuthProfileVerification,
  resolveEffectiveMcpAuth,
  listShortMetadataOverrides,
  listMatrixTrackPreferences,
  getMatrixSortModeFromSqlite,
  StoredMcpServerRecord,
  ShortMetadataOverrideRecord
} from '../services/sqliteCatalogService';
import type { McpAuthTestResult, McpPollingStatus } from '../types/mcpStatus';

export function mergeShortOverridesIntoShorts(
  rawShorts: any[],
  overrides: ShortMetadataOverrideRecord[]
): any[] {
  const safeRaw = Array.isArray(rawShorts) ? rawShorts.filter(Boolean) : [];
  const safeOverrides = Array.isArray(overrides) ? overrides : [];
  if (safeOverrides.length === 0) return safeRaw;

  const byId = new Map<string, ShortMetadataOverrideRecord>();
  const byYtId = new Map<string, ShortMetadataOverrideRecord>();
  for (const ov of safeOverrides) {
    if (ov.shortId) byId.set(ov.shortId, ov);
    if (ov.youtubeId) byYtId.set(ov.youtubeId, ov);
  }

  const seenIds = new Set<string>();
  const merged = safeRaw.map((item) => {
    const ov = byId.get(item.id) || (item.youtube_id ? byYtId.get(item.youtube_id) : undefined);
    if (!ov) return item;
    seenIds.add(ov.shortId);
    return {
      ...item,
      track: ov.trackTitle || item.track,
      campaign: ov.campaign || item.campaign,
      status: ov.status || item.status,
      title: ov.title || item.title,
      hook_text: ov.hookText !== undefined && ov.hookText !== '' ? ov.hookText : item.hook_text,
      caption: ov.caption !== undefined && ov.caption !== '' ? ov.caption : item.caption,
      scheduled_slot: ov.scheduledSlot !== undefined && ov.scheduledSlot !== '' ? ov.scheduledSlot : item.scheduled_slot,
      youtube_id: ov.youtubeId || item.youtube_id,
      youtube_url: ov.youtubeUrl || item.youtube_url,
      spotify_url: ov.spotifyUrl || item.spotify_url,
      apple_music_url: ov.appleMusicUrl || item.apple_music_url,
      youtube_music_url: ov.youtubeMusicUrl || item.youtube_music_url,
      video_asset_url: ov.videoAssetUrl || item.video_asset_url,
      thumbnail_asset_url: ov.thumbnailAssetUrl || item.thumbnail_asset_url,
      platform_links:
        ov.platformLinks && Object.keys(ov.platformLinks).length > 0
          ? { ...(item.platform_links || {}), ...ov.platformLinks }
          : item.platform_links
    };
  });

  // Also include Shorts staged/edited directly from Live YouTube Videos if not yet in remote get_ready_shorts
  for (const ov of safeOverrides) {
    if (seenIds.has(ov.shortId)) continue;
    merged.unshift({
      id: ov.shortId,
      campaign: ov.campaign || ov.trackTitle || 'Live Short',
      track: ov.trackTitle || ov.campaign || ov.title,
      status: ov.status || 'SCHEDULED / EDITED',
      title: ov.title,
      hook_text: ov.hookText,
      caption: ov.caption,
      scheduled_slot: ov.scheduledSlot,
      youtube_id: ov.youtubeId,
      youtube_url: ov.youtubeUrl,
      spotify_url: ov.spotifyUrl,
      apple_music_url: ov.appleMusicUrl,
      youtube_music_url: ov.youtubeMusicUrl,
      video_asset_url: ov.videoAssetUrl,
      thumbnail_asset_url: ov.thumbnailAssetUrl,
      platform_links: ov.platformLinks || {},
      format: '9:16 vertical 1080x1920'
    });
  }

  return merged;
}

export interface McpRpcResult<T = any> {
  ok: boolean;
  status: number;
  latencyMs: number;
  wwwAuthenticate?: string;
  raw?: any;
  parsed?: T;
  error?: string;
}

export interface McpToolCallRequest {
  serverId: string;
  toolName: string;
  arguments?: Record<string, any>;
  timeoutMs?: number;
}

export interface McpToolCallResponse<T = any> {
  success: boolean;
  serverId: string;
  toolName: string;
  httpStatus: number;
  latencyMs: number;
  data: T | null;
  error: string | null;
}

export interface McpToolCaller {
  callTool<T = any>(req: McpToolCallRequest): Promise<McpToolCallResponse<T>>;
  readResource(serverId: string, uri: string): Promise<{
    success: boolean;
    serverId: string;
    uri: string;
    latencyMs: number;
    content: any;
    error: string | null;
  }>;
  discover(serverId: string): Promise<any>;
}

const POLLING_KV_KEY = 'mcp_polling_config_v1';
const MIN_POLL_INTERVAL_MS = 15000;
const MAX_POLL_INTERVAL_MS = 30 * 60 * 1000;

function extractMcpTextPayload(rpcJson: any): any {
  const content = rpcJson?.result?.content;
  if (Array.isArray(content) && content.length > 0) {
    const first = content[0];
    if (first?.type === 'text' && typeof first.text === 'string') {
      const trimmed = first.text.trim();
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        try {
          return JSON.parse(trimmed);
        } catch {
          return trimmed;
        }
      }
      return trimmed;
    }
    return content;
  }
  const contents = rpcJson?.result?.contents;
  if (Array.isArray(contents) && contents.length > 0) {
    return contents[0]?.text ?? contents[0];
  }
  return rpcJson?.result ?? rpcJson;
}

function parseSseOrJson(text: string): any {
  const trimmed = text.trim();
  if (!trimmed) return {};
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return JSON.parse(trimmed);
  }
  const lines = trimmed.split(/\r?\n/);
  let lastData: any = null;
  for (const line of lines) {
    if (line.startsWith('data:')) {
      const candidate = line.slice(5).trim();
      if (!candidate || candidate === '[DONE]') continue;
      try {
        lastData = JSON.parse(candidate);
      } catch {
        // Ignore partial non-JSON lines in SSE frames
      }
    }
  }
  if (lastData !== null) return lastData;
  return { rawText: trimmed };
}

export function buildMcpHeaders(
  server?: StoredMcpServerRecord | null,
  overrideAuth?: {
    mode: 'none' | 'bearer' | 'header';
    headerName?: string;
    secret?: string;
  }
): { headers: Record<string, string>; authModeLabel: string } {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json, text/event-stream'
  };

  if (overrideAuth) {
    if (overrideAuth.mode === 'bearer' && overrideAuth.secret) {
      const clean = overrideAuth.secret.replace(/^Bearer\s+/i, '').trim();
      headers['Authorization'] = `Bearer ${clean}`;
      return { headers, authModeLabel: 'Bearer Token' };
    }
    if (overrideAuth.mode === 'header' && overrideAuth.headerName && overrideAuth.secret) {
      headers[overrideAuth.headerName.trim()] = overrideAuth.secret.trim();
      return { headers, authModeLabel: `Header (${overrideAuth.headerName.trim()})` };
    }
    return { headers, authModeLabel: 'None (Open)' };
  }

  if (server) {
    const resolved = resolveEffectiveMcpAuth(server);
    if (resolved.mode === 'bearer' && resolved.secret) {
      const clean = resolved.secret.replace(/^Bearer\s+/i, '').trim();
      headers['Authorization'] = `Bearer ${clean}`;
      return {
        headers,
        authModeLabel: resolved.profileName
          ? `Bearer Profile: ${resolved.profileName}`
          : resolved.source === 'env'
          ? 'Env Bearer Token'
          : 'Bearer Token'
      };
    }
    if (resolved.mode === 'header' && resolved.headerName && resolved.secret) {
      headers[resolved.headerName] = resolved.secret;
      return {
        headers,
        authModeLabel: resolved.profileName
          ? `Header Profile: ${resolved.profileName}`
          : `Header (${resolved.headerName})`
      };
    }
  }

  return { headers, authModeLabel: 'None (Open)' };
}

export class McpProxyService implements McpToolCaller {
  async callRpcRaw<T = any>(
    url: string,
    headers: Record<string, string>,
    method: string,
    params: Record<string, any> = {},
    timeoutMs = 12000
  ): Promise<McpRpcResult<T>> {
    const start = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await undiciFetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: `${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          method,
          params
        }),
        signal: controller.signal
      });
      const text = await response.text();
      const latencyMs = Date.now() - start;
      const wwwAuthenticate = response.headers.get('www-authenticate') || '';

      if (!response.ok) {
        return {
          ok: false,
          status: response.status,
          latencyMs,
          wwwAuthenticate,
          error: `HTTP ${response.status}: ${text.slice(0, 300) || response.statusText}`
        };
      }

      const rpcJson = parseSseOrJson(text);
      if (rpcJson?.error) {
        return {
          ok: false,
          status: response.status,
          latencyMs,
          wwwAuthenticate,
          raw: rpcJson,
          error: rpcJson.error?.message || JSON.stringify(rpcJson.error)
        };
      }

      const parsed =
        method === 'tools/call' || method === 'resources/read'
          ? extractMcpTextPayload(rpcJson)
          : rpcJson?.result ?? rpcJson;

      return {
        ok: true,
        status: response.status,
        latencyMs,
        wwwAuthenticate,
        raw: rpcJson,
        parsed
      };
    } catch (err: any) {
      return {
        ok: false,
        status: 0,
        latencyMs: Date.now() - start,
        error: err?.name === 'AbortError' ? `Timeout after ${timeoutMs}ms` : err?.message || String(err)
      };
    } finally {
      clearTimeout(timer);
    }
  }

  async callRpc<T = any>(
    server: StoredMcpServerRecord,
    method: string,
    params: Record<string, any> = {},
    timeoutMs = 12000
  ): Promise<McpRpcResult<T>> {
    const { headers } = buildMcpHeaders(server);
    return this.callRpcRaw<T>(server.url, headers, method, params, timeoutMs);
  }

  async discover(serverIdOrRecord: string | StoredMcpServerRecord) {
    const server =
      typeof serverIdOrRecord === 'string'
        ? getMcpServerByIdFromSqlite(serverIdOrRecord, true)
        : serverIdOrRecord;
    if (!server) {
      return { ok: false, latencyMs: 0, error: 'MCP server not found.', tools: [], resources: [] };
    }

    const initRes = await this.callRpc(server, 'initialize', {
      protocolVersion: '2025-03-26',
      capabilities: {},
      clientInfo: { name: 'brickos-studio-hub', version: '2.1.0' }
    });

    if (!initRes.ok) {
      updateMcpDiscoveryInSqlite(server.id, {
        lastStatus: 'error',
        lastLatencyMs: initRes.latencyMs,
        lastError: initRes.error || 'Initialization failed'
      });
      return {
        ok: false,
        status: initRes.status,
        latencyMs: initRes.latencyMs,
        error: initRes.error || 'Initialization failed',
        serverInfo: server.serverInfo,
        tools: server.tools,
        resources: server.resources
      };
    }

    const [toolsRes, resourcesRes] = await Promise.all([
      this.callRpc(server, 'tools/list', {}),
      this.callRpc(server, 'resources/list', {})
    ]);

    const tools = Array.isArray(toolsRes.parsed?.tools) ? toolsRes.parsed.tools : [];
    const resources = Array.isArray(resourcesRes.parsed?.resources) ? resourcesRes.parsed.resources : [];
    const serverInfo = initRes.parsed?.serverInfo || {};

    updateMcpDiscoveryInSqlite(server.id, {
      lastStatus: 'connected',
      lastLatencyMs: initRes.latencyMs,
      lastError: '',
      serverInfo,
      tools,
      resources
    });

    if (server.authProfileId) {
      updateMcpAuthProfileVerification(server.authProfileId, initRes.status || 200);
    }

    return {
      ok: true,
      status: initRes.status,
      latencyMs: initRes.latencyMs,
      serverInfo,
      protocolVersion: initRes.parsed?.protocolVersion || '2025-03-26',
      tools,
      resources
    };
  }

  async callTool<T = any>(req: McpToolCallRequest): Promise<McpToolCallResponse<T>> {
    const server = getMcpServerByIdFromSqlite(req.serverId || 'brickos-primary-mcp', true);
    if (!server) {
      return {
        success: false,
        serverId: req.serverId,
        toolName: req.toolName,
        httpStatus: 404,
        latencyMs: 0,
        data: null,
        error: `MCP server '${req.serverId}' not found.`
      };
    }
    const timeoutMs = req.timeoutMs ?? (req.toolName === 'brickos_job_wait' ? 50000 : 18000);
    const rpc = await this.callRpc<T>(
      server,
      'tools/call',
      { name: req.toolName, arguments: req.arguments || {} },
      timeoutMs
    );

    return {
      success: rpc.ok,
      serverId: server.id,
      toolName: req.toolName,
      httpStatus: rpc.status,
      latencyMs: rpc.latencyMs,
      data: (rpc.parsed ?? null) as T | null,
      error: rpc.error || null
    };
  }

  async readResource(serverId: string, uri: string) {
    const server = getMcpServerByIdFromSqlite(serverId || 'brickos-primary-mcp', true);
    if (!server) {
      return {
        success: false,
        serverId,
        uri,
        latencyMs: 0,
        content: '',
        error: `MCP server '${serverId}' not found.`
      };
    }
    const rpc = await this.callRpc(server, 'resources/read', { uri });
    return {
      success: rpc.ok,
      serverId: server.id,
      uri,
      latencyMs: rpc.latencyMs,
      content: rpc.parsed ?? '',
      error: rpc.error || null
    };
  }

  async testAuthAndHandshake(params: {
    serverId?: string;
    url?: string;
    authType?: 'none' | 'bearer' | 'header' | 'profile';
    authHeaderName?: string;
    authToken?: string;
    authProfileId?: string;
  }): Promise<McpAuthTestResult> {
    let targetUrl = (params.url || '').trim();
    const existingServer = params.serverId ? getMcpServerByIdFromSqlite(params.serverId, true) : null;
    if (!targetUrl && existingServer) {
      targetUrl = existingServer.url;
    }
    if (!targetUrl) {
      targetUrl = 'https://brick-mcp.moyercloud.com/mcp';
    }

    let resolvedAuth: { mode: 'none' | 'bearer' | 'header'; headerName?: string; secret?: string } | undefined;
    let profileIdToMark = '';

    if (params.authType === 'profile' && params.authProfileId) {
      const profile = getMcpAuthProfileByIdFromSqlite(params.authProfileId, true);
      if (!profile) {
        return {
          ok: false,
          httpStatus: 400,
          latencyMs: 0,
          authModeUsed: 'Profile (Missing)',
          authChallenge: '',
          error: 'Selected Auth Profile was not found.',
          hint: 'Select an existing Bearer Auth Profile or create a new one.'
        };
      }
      profileIdToMark = profile.id;
      resolvedAuth = {
        mode: profile.authType === 'header' ? 'header' : 'bearer',
        headerName: profile.authType === 'header' ? profile.headerName : 'Authorization',
        secret: profile.secret
      };
    } else if (params.authType === 'bearer' || params.authType === 'header') {
      const rawInput = (params.authToken || '').trim();
      const secret =
        rawInput && rawInput !== '••••••••'
          ? rawInput
          : existingServer?.authToken || '';
      resolvedAuth = {
        mode: params.authType,
        headerName: params.authHeaderName || 'Authorization',
        secret
      };
    } else if (params.authType === 'none') {
      resolvedAuth = { mode: 'none' };
    }

    const { headers, authModeLabel } = buildMcpHeaders(existingServer, resolvedAuth);
    const initRes = await this.callRpcRaw(
      targetUrl,
      headers,
      'initialize',
      {
        protocolVersion: '2025-03-26',
        capabilities: {},
        clientInfo: { name: 'brickos-auth-tester', version: '2.1.0' }
      },
      10000
    );

    if (profileIdToMark && initRes.status > 0) {
      updateMcpAuthProfileVerification(profileIdToMark, initRes.status);
    }

    if (!initRes.ok) {
      let hint = 'Verify endpoint URL is reachable from the server over HTTPS JSON-RPC 2.0.';
      if (initRes.status === 401) {
        hint = '401 Unauthorized: Paste the Bearer token configured in Gemini Android / MCP server env.';
      } else if (initRes.status === 403) {
        hint = '403 Forbidden: Bearer token was rejected or lacks access scope for this MCP endpoint.';
      }
      return {
        ok: false,
        httpStatus: initRes.status,
        latencyMs: initRes.latencyMs,
        authModeUsed: authModeLabel,
        authChallenge: initRes.wwwAuthenticate || '',
        error: initRes.error || 'Handshake failed',
        hint
      };
    }

    const [toolsRes, resourcesRes] = await Promise.all([
      this.callRpcRaw(targetUrl, headers, 'tools/list', {}, 8000),
      this.callRpcRaw(targetUrl, headers, 'resources/list', {}, 8000)
    ]);

    return {
      ok: true,
      httpStatus: initRes.status || 200,
      latencyMs: initRes.latencyMs,
      authModeUsed: authModeLabel,
      authChallenge: initRes.wwwAuthenticate || '',
      protocolVersion: initRes.parsed?.protocolVersion || '2025-03-26',
      serverInfo: initRes.parsed?.serverInfo || {},
      toolCount: Array.isArray(toolsRes.parsed?.tools) ? toolsRes.parsed.tools.length : 0,
      resourceCount: Array.isArray(resourcesRes.parsed?.resources) ? resourcesRes.parsed.resources.length : 0,
      hint: 'Bearer/endpoint handshake verified cleanly.'
    };
  }
}

export const mcpProxyService = new McpProxyService();

export class McpPollingEngine {
  private timer: NodeJS.Timeout | null = null;
  private activePollPromise: Promise<any> | null = null;
  private enabled = true;
  private intervalMs = 60000;
  private lastPollAt: string | null = null;
  private lastPollDurationMs = 0;
  private consecutiveErrors = 0;
  private lastErrors: string[] = [];

  private loadConfigFromDb() {
    try {
      const raw = getServerKvState(POLLING_KV_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed.enabled === 'boolean') this.enabled = parsed.enabled;
        if (typeof parsed.intervalMs === 'number' && parsed.intervalMs >= MIN_POLL_INTERVAL_MS) {
          this.intervalMs = Math.min(parsed.intervalMs, MAX_POLL_INTERVAL_MS);
        }
      }
    } catch {}
  }

  private saveConfigToDb() {
    try {
      setServerKvState(
        POLLING_KV_KEY,
        JSON.stringify({ enabled: this.enabled, intervalMs: this.intervalMs })
      );
    } catch {}
  }

  start() {
    this.loadConfigFromDb();
    this.scheduleNext();
    // Run an initial warm poll shortly after server start without blocking boot
    setTimeout(() => {
      if (this.enabled) {
        this.triggerPollNow(true).catch(() => {});
      }
    }, 2500);
  }

  stop() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private scheduleNext() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (!this.enabled) return;
    this.timer = setTimeout(() => {
      this.triggerPollNow(true).catch(() => {});
    }, this.intervalMs);
    if (typeof this.timer.unref === 'function') {
      this.timer.unref();
    }
  }

  updateConfig(params: { enabled?: boolean; intervalMs?: number }): McpPollingStatus {
    if (typeof params.enabled === 'boolean') {
      this.enabled = params.enabled;
    }
    if (typeof params.intervalMs === 'number' && Number.isFinite(params.intervalMs)) {
      this.intervalMs = Math.max(MIN_POLL_INTERVAL_MS, Math.min(MAX_POLL_INTERVAL_MS, Math.round(params.intervalMs)));
    }
    this.saveConfigToDb();
    this.scheduleNext();
    return this.getStatus();
  }

  getStatus(): McpPollingStatus {
    const nextPollAt =
      this.enabled && this.lastPollAt
        ? new Date(new Date(this.lastPollAt).getTime() + this.intervalMs).toISOString()
        : this.enabled
        ? new Date(Date.now() + this.intervalMs).toISOString()
        : null;
    return {
      enabled: this.enabled,
      intervalMs: this.intervalMs,
      isPolling: this.activePollPromise !== null,
      lastPollAt: this.lastPollAt,
      lastPollDurationMs: this.lastPollDurationMs,
      nextPollAt,
      consecutiveErrors: this.consecutiveErrors,
      lastErrors: this.lastErrors
    };
  }

  async triggerPollNow(fromScheduler = false) {
    if (this.activePollPromise) {
      return this.activePollPromise;
    }

    this.activePollPromise = this.executeIngestPoll()
      .finally(() => {
        this.activePollPromise = null;
        if (this.enabled || fromScheduler) {
          this.scheduleNext();
        }
      });

    return this.activePollPromise;
  }

  async executeIngestPoll() {
    const start = Date.now();
    const serversWithSecrets = listMcpServersFromSqlite(true);
    const primary =
      serversWithSecrets.find((s) => s.id === 'brickos-primary-mcp') ||
      serversWithSecrets.find((s) => s.enabled) ||
      null;

    let primaryDiscovery: any = null;
    let socialStats: any = null;
    let sheetStats: any = null;
    let readyShorts: any[] = [];
    let releaseLinks: Record<string, any> = {};
    let museMessages: any = null;
    let trackSyncList: any = null;
    let progressMd = '';
    const errors: string[] = [];

    if (primary && primary.enabled) {
      const isStale =
        !primary.lastSyncedAt ||
        Date.now() - new Date(primary.lastSyncedAt).getTime() > 10 * 60 * 1000 ||
        primary.tools.length === 0;

      if (isStale) {
        primaryDiscovery = await mcpProxyService.discover(primary);
      }

      const [statsRes, sheetRes, shortsRes, linksRes, museRes, tracksRes, progressRes] = await Promise.all([
        mcpProxyService.callRpc(primary, 'tools/call', { name: 'brickos_get_social_stats', arguments: { source: 'all', limit: 15 } }, 15000),
        mcpProxyService.callRpc(
          primary,
          'tools/call',
          { name: 'brickos_get_social_stats', arguments: { source: 'google_sheet', sheet_tab: 'Posts', limit: 15 } },
          10000
        ),
        mcpProxyService.callRpc(primary, 'tools/call', { name: 'get_ready_shorts', arguments: {} }, 12000),
        mcpProxyService.callRpc(primary, 'tools/call', { name: 'get_live_release_links', arguments: {} }, 10000),
        mcpProxyService.callRpc(
          primary,
          'tools/call',
          { name: 'brickos_muse_bridge', arguments: { action: 'read_messages', limit: 15 } },
          12000
        ),
        mcpProxyService.callRpc(
          primary,
          'tools/call',
          { name: 'brickos_track_sync', arguments: { track_slug: 'the-milestone', action: 'list' } },
          12000
        ),
        mcpProxyService.callRpc(primary, 'resources/read', { uri: 'brickos://PROGRESS.md' }, 10000)
      ]);

      if (statsRes.ok) socialStats = statsRes.parsed;
      else if (statsRes.error) errors.push(`brickos_get_social_stats: ${statsRes.error}`);

      if (sheetRes.ok) sheetStats = sheetRes.parsed?.google_sheet || sheetRes.parsed;

      if (shortsRes.ok && Array.isArray(shortsRes.parsed)) readyShorts = shortsRes.parsed;
      else if (shortsRes.error) errors.push(`get_ready_shorts: ${shortsRes.error}`);

      if (linksRes.ok && linksRes.parsed) releaseLinks = linksRes.parsed;
      if (museRes.ok && museRes.parsed) museMessages = museRes.parsed;
      if (tracksRes.ok && tracksRes.parsed) trackSyncList = tracksRes.parsed;
      if (progressRes.ok && typeof progressRes.parsed === 'string') progressMd = progressRes.parsed;
    }

    // Discover stale custom enabled servers (with backoff skip if repeatedly failing)
    const customServers = serversWithSecrets.filter((s) => s.id !== 'brickos-primary-mcp' && s.enabled);
    await Promise.all(
      customServers.map(async (srv) => {
        const shouldSkipBackoff =
          srv.consecutiveFailures >= 3 &&
          srv.lastSyncedAt &&
          Date.now() - new Date(srv.lastSyncedAt).getTime() < 5 * 60 * 1000;
        if (shouldSkipBackoff) return;
        if (!srv.lastSyncedAt || srv.tools.length === 0) {
          await mcpProxyService.discover(srv);
        }
      })
    );

    // Refresh pinned widgets across all enabled MCP servers
    const pins = listMcpPinnedWidgets();
    const refreshedPins = await Promise.all(
      pins.map(async (pin) => {
        const srv = serversWithSecrets.find((s) => s.id === pin.serverId && s.enabled);
        if (!srv) return pin;
        const rpc = await mcpProxyService.callRpc(srv, 'tools/call', { name: pin.toolName, arguments: pin.args }, 10000);
        if (rpc.ok) {
          return (
            upsertMcpPinnedWidget({
              id: pin.id,
              serverId: pin.serverId,
              toolName: pin.toolName,
              title: pin.title,
              args: pin.args,
              lastResult: rpc.parsed
            }) || pin
          );
        }
        return pin;
      })
    );

    const durationMs = Date.now() - start;
    this.lastPollAt = new Date().toISOString();
    this.lastPollDurationMs = durationMs;
    this.lastErrors = errors;
    this.consecutiveErrors = errors.length > 0 && !socialStats ? this.consecutiveErrors + 1 : 0;

    const outletStatuses = listSocialOutletStatuses();
    const shortOverrides = listShortMetadataOverrides();
    const matrixPreferences = listMatrixTrackPreferences();
    const matrixSortMode = getMatrixSortModeFromSqlite();
    const maskedServers = listMcpServersFromSqlite(false);
    const authProfiles = listMcpAuthProfilesFromSqlite(false);

    const mergedShorts = mergeShortOverridesIntoShorts(readyShorts, shortOverrides);

    const payload = {
      success: true,
      fetchedAt: this.lastPollAt,
      latencyMs: durationMs,
      fromCache: false,
      errors,
      servers: maskedServers,
      authProfiles,
      polling: this.getStatus(),
      primaryDiscovery,
      youtube: socialStats?.youtube || null,
      metaMuse: {
        reportsSummary: socialStats?.meta_muse || null,
        messages: museMessages?.messages || [],
        totalMessages: museMessages?.total_messages || 0
      },
      googleSheet: sheetStats || null,
      readyShorts: mergedShorts,
      releaseLinks,
      mcpTracks: Array.isArray(trackSyncList?.tracks) ? trackSyncList.tracks : [],
      progressMarkdown: progressMd,
      outletStatuses,
      shortOverrides,
      matrixPreferences,
      matrixSortMode,
      pinnedWidgets: refreshedPins
    };

    if (socialStats || readyShorts.length > 0) {
      setMcpTelemetryCache('dashboard_ingest_v1', {
        ...payload,
        readyShorts
      });
    }

    return payload;
  }
}

export const mcpPollingEngine = new McpPollingEngine();
