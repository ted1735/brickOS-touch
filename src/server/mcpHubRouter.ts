import express from 'express';
import { fetch as undiciFetch } from 'undici';
import { GoogleGenAI } from '@google/genai';
import {
  listMcpServersFromSqlite,
  getMcpServerByIdFromSqlite,
  upsertMcpServerInSqlite,
  updateMcpDiscoveryInSqlite,
  deleteMcpServerFromSqlite,
  listMcpPinnedWidgets,
  upsertMcpPinnedWidget,
  deleteMcpPinnedWidget,
  listSocialOutletStatuses,
  upsertSocialOutletStatus,
  getMcpTelemetryCache,
  setMcpTelemetryCache,
  StoredMcpServerRecord
} from '../services/sqliteCatalogService';

export interface McpRpcResult<T = any> {
  ok: boolean;
  status: number;
  latencyMs: number;
  raw?: any;
  parsed?: T;
  error?: string;
}

function buildAuthHeaders(server: StoredMcpServerRecord): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json, text/event-stream'
  };
  if (server.authType === 'bearer' && server.authToken) {
    headers['Authorization'] = server.authToken.startsWith('Bearer ')
      ? server.authToken
      : `Bearer ${server.authToken}`;
  } else if (server.authType === 'header' && server.authHeaderName && server.authToken) {
    headers[server.authHeaderName] = server.authToken;
  }
  return headers;
}

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
  // Parse SSE stream lines: pick last JSON-RPC data payload
  const lines = trimmed.split(/\r?\n/);
  let lastData: any = null;
  for (const line of lines) {
    if (line.startsWith('data:')) {
      const candidate = line.slice(5).trim();
      if (!candidate || candidate === '[DONE]') continue;
      try {
        lastData = JSON.parse(candidate);
      } catch {
        // ignore partial non-json event lines
      }
    }
  }
  if (lastData !== null) return lastData;
  return { rawText: trimmed };
}

export async function callMcpRpc<T = any>(
  server: StoredMcpServerRecord,
  method: string,
  params: Record<string, any> = {},
  timeoutMs = 12000
): Promise<McpRpcResult<T>> {
  const start = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await undiciFetch(server.url, {
      method: 'POST',
      headers: buildAuthHeaders(server),
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

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        latencyMs,
        error: `HTTP ${response.status}: ${text.slice(0, 300)}`
      };
    }

    const rpcJson = parseSseOrJson(text);
    if (rpcJson?.error) {
      return {
        ok: false,
        status: response.status,
        latencyMs,
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

export async function discoverMcpServer(server: StoredMcpServerRecord) {
  const initRes = await callMcpRpc(server, 'initialize', {
    protocolVersion: '2025-03-26',
    capabilities: {},
    clientInfo: { name: 'brickos-studio-hub', version: '2.0.0' }
  });

  if (!initRes.ok) {
    updateMcpDiscoveryInSqlite(server.id, {
      lastStatus: 'error',
      lastLatencyMs: initRes.latencyMs,
      lastError: initRes.error || 'Initialization failed'
    });
    return {
      ok: false,
      latencyMs: initRes.latencyMs,
      error: initRes.error || 'Initialization failed',
      serverInfo: server.serverInfo,
      tools: server.tools,
      resources: server.resources
    };
  }

  const [toolsRes, resourcesRes] = await Promise.all([
    callMcpRpc(server, 'tools/list', {}),
    callMcpRpc(server, 'resources/list', {})
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

  return {
    ok: true,
    latencyMs: initRes.latencyMs,
    serverInfo,
    protocolVersion: initRes.parsed?.protocolVersion || '2025-03-26',
    tools,
    resources
  };
}

export function createMcpHubRouter(): express.Router {
  const router = express.Router();

  // List registered MCP servers (secrets masked)
  router.get('/api/mcp/servers', (_req, res) => {
    try {
      const servers = listMcpServersFromSqlite(false);
      res.json({ success: true, servers });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Register or update an MCP server (auto-discovers capabilities on save if enabled)
  router.post('/api/mcp/servers', async (req, res) => {
    try {
      const { id, name, url, authType, authHeaderName, authToken, enabled, discover = true } = req.body || {};
      if (!name || !url) {
        return res.status(400).json({ success: false, error: 'Server name and URL are required.' });
      }
      const saved = upsertMcpServerInSqlite({
        id,
        name: String(name),
        url: String(url),
        authType: authType || 'none',
        authHeaderName: authHeaderName || 'Authorization',
        authToken: typeof authToken === 'string' ? authToken : '',
        enabled: enabled !== false
      });

      if (!saved) {
        return res.status(500).json({ success: false, error: 'Failed to persist MCP server in SQLite.' });
      }

      let discovery: any = null;
      if (discover && saved.enabled) {
        const withSecret = getMcpServerByIdFromSqlite(saved.id, true);
        if (withSecret) {
          discovery = await discoverMcpServer(withSecret);
        }
      }

      const fresh = getMcpServerByIdFromSqlite(saved.id, false);
      res.json({ success: true, server: fresh || saved, discovery });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Delete custom MCP server
  router.delete('/api/mcp/servers/:id', (req, res) => {
    try {
      const { id } = req.params;
      if (id === 'brickos-primary-mcp') {
        return res.status(400).json({ success: false, error: 'Primary brickOS MCP server cannot be deleted.' });
      }
      const deleted = deleteMcpServerFromSqlite(id);
      res.json({ success: deleted });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Run initialize + tools/list + resources/list on an MCP server
  router.post('/api/mcp/discover', async (req, res) => {
    try {
      const serverId = req.body?.serverId || 'brickos-primary-mcp';
      const server = getMcpServerByIdFromSqlite(serverId, true);
      if (!server) {
        return res.status(404).json({ success: false, error: `MCP server '${serverId}' not found.` });
      }
      const discovery = await discoverMcpServer(server);
      const updatedServer = getMcpServerByIdFromSqlite(serverId, false);
      res.json({ success: discovery.ok, server: updatedServer, discovery });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Execute any tool on any registered MCP server
  router.post('/api/mcp/call', async (req, res) => {
    try {
      const serverId = req.body?.serverId || 'brickos-primary-mcp';
      const toolName = req.body?.toolName;
      const args = req.body?.arguments || {};

      if (!toolName) {
        return res.status(400).json({ success: false, error: 'toolName is required.' });
      }

      const server = getMcpServerByIdFromSqlite(serverId, true);
      if (!server) {
        return res.status(404).json({ success: false, error: `MCP server '${serverId}' not found.` });
      }

      const timeoutMs = toolName === 'brickos_job_wait' ? 50000 : 18000;
      const rpc = await callMcpRpc(server, 'tools/call', { name: toolName, arguments: args }, timeoutMs);
      res.json({
        success: rpc.ok,
        serverId,
        toolName,
        latencyMs: rpc.latencyMs,
        data: rpc.parsed ?? null,
        error: rpc.error || null
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Read any resource URI from an MCP server
  router.post('/api/mcp/resource', async (req, res) => {
    try {
      const serverId = req.body?.serverId || 'brickos-primary-mcp';
      const uri = req.body?.uri;
      if (!uri) {
        return res.status(400).json({ success: false, error: 'Resource uri is required.' });
      }
      const server = getMcpServerByIdFromSqlite(serverId, true);
      if (!server) {
        return res.status(404).json({ success: false, error: `MCP server '${serverId}' not found.` });
      }
      const rpc = await callMcpRpc(server, 'resources/read', { uri });
      res.json({
        success: rpc.ok,
        serverId,
        uri,
        latencyMs: rpc.latencyMs,
        content: rpc.parsed ?? '',
        error: rpc.error || null
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Pinned MCP widgets CRUD
  router.get('/api/mcp/pins', (_req, res) => {
    res.json({ success: true, pins: listMcpPinnedWidgets() });
  });

  router.post('/api/mcp/pins', async (req, res) => {
    try {
      const { id, serverId = 'brickos-primary-mcp', toolName, title, args = {} } = req.body || {};
      if (!toolName || !title) {
        return res.status(400).json({ success: false, error: 'toolName and title are required.' });
      }
      let lastResult: any = undefined;
      const server = getMcpServerByIdFromSqlite(serverId, true);
      if (server && server.enabled) {
        const rpc = await callMcpRpc(server, 'tools/call', { name: toolName, arguments: args }, 12000);
        if (rpc.ok) lastResult = rpc.parsed;
      }
      const pin = upsertMcpPinnedWidget({ id, serverId, toolName, title, args, lastResult });
      res.json({ success: true, pin });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  router.delete('/api/mcp/pins/:id', (req, res) => {
    res.json({ success: deleteMcpPinnedWidget(req.params.id) });
  });

  // Social Outlet Status persistence
  router.get('/api/studio/outlet-statuses', (_req, res) => {
    res.json({ success: true, statuses: listSocialOutletStatuses() });
  });

  router.post('/api/studio/outlet-status', (req, res) => {
    try {
      const { trackId, outletKey, status, scheduledSlot, postUrl, postId, cohort, playlistId, notes } = req.body || {};
      if (!trackId || !outletKey || !status) {
        return res.status(400).json({ success: false, error: 'trackId, outletKey, and status are required.' });
      }
      const saved = upsertSocialOutletStatus({
        trackId,
        outletKey,
        status,
        scheduledSlot,
        postUrl,
        postId,
        cohort,
        playlistId,
        notes
      });
      res.json({ success: true, record: saved });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Unified Dashboard Ingest Endpoint: aggregates live telemetry from brickOS MCP + custom MCP pins
  router.get('/api/mcp/dashboard-ingest', async (req, res) => {
    const start = Date.now();
    const forceCacheFallback = req.query.cacheOnly === '1';

    if (forceCacheFallback) {
      const cached = getMcpTelemetryCache('dashboard_ingest_v1');
      if (cached) {
        return res.json({ ...cached.payload, fromCache: true, cachedAt: cached.updatedAt });
      }
    }

    try {
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
        // Refresh discovery metadata if empty or stale (> 10m)
        const isStale =
          !primary.lastSyncedAt ||
          Date.now() - new Date(primary.lastSyncedAt).getTime() > 10 * 60 * 1000 ||
          primary.tools.length === 0;

        if (isStale) {
          primaryDiscovery = await discoverMcpServer(primary);
        }

        const [statsRes, sheetRes, shortsRes, linksRes, museRes, tracksRes, progressRes] = await Promise.all([
          callMcpRpc(primary, 'tools/call', { name: 'brickos_get_social_stats', arguments: { source: 'all', limit: 15 } }, 15000),
          callMcpRpc(
            primary,
            'tools/call',
            { name: 'brickos_get_social_stats', arguments: { source: 'google_sheet', sheet_tab: 'Posts', limit: 15 } },
            10000
          ),
          callMcpRpc(primary, 'tools/call', { name: 'get_ready_shorts', arguments: {} }, 12000),
          callMcpRpc(primary, 'tools/call', { name: 'get_live_release_links', arguments: {} }, 10000),
          callMcpRpc(
            primary,
            'tools/call',
            { name: 'brickos_muse_bridge', arguments: { action: 'read_messages', limit: 15 } },
            12000
          ),
          callMcpRpc(
            primary,
            'tools/call',
            { name: 'brickos_track_sync', arguments: { track_slug: 'the-milestone', action: 'list' } },
            12000
          ),
          callMcpRpc(primary, 'resources/read', { uri: 'brickos://PROGRESS.md' }, 10000)
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

      // Discover any custom enabled servers that haven't synced yet
      const customServers = serversWithSecrets.filter((s) => s.id !== 'brickos-primary-mcp' && s.enabled);
      await Promise.all(
        customServers.map(async (srv) => {
          if (!srv.lastSyncedAt || srv.tools.length === 0) {
            await discoverMcpServer(srv);
          }
        })
      );

      // Refresh pinned widgets across all enabled MCP servers
      const pins = listMcpPinnedWidgets();
      const refreshedPins = await Promise.all(
        pins.map(async (pin) => {
          const srv = serversWithSecrets.find((s) => s.id === pin.serverId && s.enabled);
          if (!srv) return pin;
          const rpc = await callMcpRpc(srv, 'tools/call', { name: pin.toolName, arguments: pin.args }, 10000);
          if (rpc.ok) {
            return upsertMcpPinnedWidget({
              id: pin.id,
              serverId: pin.serverId,
              toolName: pin.toolName,
              title: pin.title,
              args: pin.args,
              lastResult: rpc.parsed
            }) || pin;
          }
          return pin;
        })
      );

      const outletStatuses = listSocialOutletStatuses();
      const maskedServers = listMcpServersFromSqlite(false);

      const payload = {
        success: true,
        fetchedAt: new Date().toISOString(),
        latencyMs: Date.now() - start,
        fromCache: false,
        errors,
        servers: maskedServers,
        primaryDiscovery,
        youtube: socialStats?.youtube || null,
        metaMuse: {
          reportsSummary: socialStats?.meta_muse || null,
          messages: museMessages?.messages || [],
          totalMessages: museMessages?.total_messages || 0
        },
        googleSheet: sheetStats || null,
        readyShorts,
        releaseLinks,
        mcpTracks: Array.isArray(trackSyncList?.tracks) ? trackSyncList.tracks : [],
        progressMarkdown: progressMd,
        outletStatuses,
        pinnedWidgets: refreshedPins
      };

      if (socialStats || readyShorts.length > 0) {
        setMcpTelemetryCache('dashboard_ingest_v1', payload);
      }

      res.json(payload);
    } catch (err: any) {
      const cached = getMcpTelemetryCache('dashboard_ingest_v1');
      if (cached) {
        return res.json({
          ...cached.payload,
          fromCache: true,
          cachedAt: cached.updatedAt,
          errors: [err.message]
        });
      }
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Pull deep per-project coordination telemetry for the active track_slug
  router.post('/api/mcp/project-coordination', async (req, res) => {
    const start = Date.now();
    try {
      const trackSlug = String(req.body?.trackSlug || '').trim();
      if (!trackSlug) {
        return res.status(400).json({ success: false, error: 'trackSlug is required.' });
      }
      const server = getMcpServerByIdFromSqlite('brickos-primary-mcp', true);
      if (!server || !server.enabled) {
        return res.status(404).json({ success: false, error: 'Primary brickOS MCP server is disabled or missing.' });
      }

      const [trackGet, previewAssets, auditResult] = await Promise.all([
        callMcpRpc(server, 'tools/call', { name: 'brickos_track_sync', arguments: { track_slug: trackSlug, action: 'get' } }, 12000),
        callMcpRpc(server, 'tools/call', { name: 'brickos_preview_assets', arguments: { track_slug: trackSlug } }, 12000),
        callMcpRpc(server, 'tools/call', { name: 'brickos_audit_playbook', arguments: { track_slug: trackSlug } }, 12000)
      ]);

      res.json({
        success: true,
        trackSlug,
        latencyMs: Date.now() - start,
        trackRecord: trackGet.ok ? trackGet.parsed : { error: trackGet.error },
        previewAssets: previewAssets.ok ? previewAssets.parsed : { error: previewAssets.error },
        auditReport: auditResult.ok ? auditResult.parsed : { error: auditResult.error }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Server-side Gemini Status Brief synthesizer (triggered explicitly by user button)
  router.post('/api/mcp/synthesize-brief', async (req, res) => {
    try {
      const snapshot = req.body?.snapshot || {};
      const activeTrackTitle = req.body?.activeTrackTitle || '';
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({
          success: false,
          error: 'GEMINI_API_KEY is not configured in Settings > Secrets.'
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      const prompt = `You are the brickOS Release Director coordinating audio masters, vertical Shorts, YouTube @brickRedeemed stats, Meta Muse (Edison IG/FB), TikTok, X, and Spotify/Apple DistroKit.
Analyze the live operational snapshot below and provide a concise, high-signal 4-bullet Status Brief covering:
1) Immediate Action Required (e.g. Meta Muse v2 vs v5_clean corrections, IG manual cancellations, or Google Sheet sync),
2) YouTube & Shorts Velocity vs 10-post median baseline,
3) Daypart / Cohort readiness for Ready Shorts & active track "${activeTrackTitle}",
4) One focused coordination priority for today.

Keep every bullet concrete, reference real campaign names, dates, and numbers from the JSON only. Never invent fake metrics.

LIVE SNAPSHOT:
${JSON.stringify(snapshot).slice(0, 12000)}`;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt
      });

      res.json({
        success: true,
        brief: response.text || 'No brief returned.',
        generatedAt: new Date().toISOString()
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Gemini brief generation failed.' });
    }
  });

  return router;
}
