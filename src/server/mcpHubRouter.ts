import express from 'express';
import { GoogleGenAI } from '@google/genai';
import {
  listMcpServersFromSqlite,
  getMcpServerByIdFromSqlite,
  upsertMcpServerInSqlite,
  deleteMcpServerFromSqlite,
  listMcpPinnedWidgets,
  upsertMcpPinnedWidget,
  deleteMcpPinnedWidget,
  listSocialOutletStatuses,
  upsertSocialOutletStatus,
  getMcpTelemetryCache,
  listMcpAuthProfilesFromSqlite,
  upsertMcpAuthProfileInSqlite,
  deleteMcpAuthProfileFromSqlite,
  listShortMetadataOverrides,
  upsertShortMetadataOverride,
  listMatrixTrackPreferences,
  upsertMatrixTrackPreference,
  bulkSaveMatrixTrackPreferences,
  saveMatrixSortOrderInSqlite,
  getMatrixSortModeFromSqlite,
  setMatrixSortModeInSqlite
} from '../services/sqliteCatalogService';
import { mcpProxyService, mcpPollingEngine, mergeShortOverridesIntoShorts } from './mcpProxyService';

export function createMcpHubRouter(): express.Router {
  const router = express.Router();

  // ==========================================
  // MCP AUTH MANAGER ROUTES (BEARER / HEADER / ENV VAULT)
  // ==========================================

  router.get('/api/mcp/auth/profiles', (_req, res) => {
    try {
      const profiles = listMcpAuthProfilesFromSqlite(false);
      res.json({ success: true, profiles });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  router.post('/api/mcp/auth/profiles', (req, res) => {
    try {
      const { id, name, authType, headerName, secret, envVarName, description, clearSecret } = req.body || {};
      if (!name || !String(name).trim()) {
        return res.status(400).json({ success: false, error: 'Profile name is required.' });
      }
      const saved = upsertMcpAuthProfileInSqlite({
        id,
        name: String(name),
        authType: authType || 'bearer',
        headerName: headerName || 'Authorization',
        secret: typeof secret === 'string' ? secret : undefined,
        envVarName: envVarName ? String(envVarName) : '',
        description: description ? String(description) : '',
        clearSecret: Boolean(clearSecret)
      });
      if (!saved) {
        return res.status(500).json({ success: false, error: 'Failed to store auth profile in encrypted vault.' });
      }
      res.json({ success: true, profile: saved, profiles: listMcpAuthProfilesFromSqlite(false) });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  router.delete('/api/mcp/auth/profiles/:id', (req, res) => {
    try {
      const deleted = deleteMcpAuthProfileFromSqlite(req.params.id);
      res.json({ success: deleted, profiles: listMcpAuthProfilesFromSqlite(false) });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  router.post('/api/mcp/auth/test', async (req, res) => {
    try {
      const result = await mcpProxyService.testAuthAndHandshake(req.body || {});
      res.json({ success: result.ok, result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ==========================================
  // MULTI-SERVER MCP REGISTRY & PROXY ROUTES
  // ==========================================

  router.get('/api/mcp/servers', (_req, res) => {
    try {
      const servers = listMcpServersFromSqlite(false);
      res.json({ success: true, servers });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  router.post('/api/mcp/servers', async (req, res) => {
    try {
      const {
        id,
        name,
        url,
        authType,
        authHeaderName,
        authToken,
        authProfileId,
        clearAuthToken,
        enabled,
        discover = true
      } = req.body || {};
      if (!name || !url) {
        return res.status(400).json({ success: false, error: 'Server name and URL are required.' });
      }
      const saved = upsertMcpServerInSqlite({
        id,
        name: String(name),
        url: String(url),
        authType: authType || 'none',
        authHeaderName: authHeaderName || 'Authorization',
        authToken: typeof authToken === 'string' ? authToken : undefined,
        authProfileId: typeof authProfileId === 'string' ? authProfileId : '',
        clearAuthToken: Boolean(clearAuthToken),
        enabled: enabled !== false
      });

      if (!saved) {
        return res.status(500).json({ success: false, error: 'Failed to persist MCP server in SQLite.' });
      }

      let discovery: any = null;
      if (discover && saved.enabled) {
        discovery = await mcpProxyService.discover(saved.id);
      }

      const fresh = getMcpServerByIdFromSqlite(saved.id, false);
      res.json({ success: true, server: fresh || saved, discovery });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

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

  router.post('/api/mcp/discover', async (req, res) => {
    try {
      const serverId = req.body?.serverId || 'brickos-primary-mcp';
      const discovery = await mcpProxyService.discover(serverId);
      const updatedServer = getMcpServerByIdFromSqlite(serverId, false);
      if (!updatedServer) {
        return res.status(404).json({ success: false, error: `MCP server '${serverId}' not found.` });
      }
      res.json({ success: Boolean(discovery.ok), server: updatedServer, discovery });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Execute any tool via unified McpToolCaller
  router.post('/api/mcp/call', async (req, res) => {
    try {
      const serverId = req.body?.serverId || 'brickos-primary-mcp';
      const toolName = req.body?.toolName;
      const args = req.body?.arguments || {};

      if (!toolName) {
        return res.status(400).json({ success: false, error: 'toolName is required.' });
      }

      const result = await mcpProxyService.callTool({ serverId, toolName, arguments: args });
      if (result.httpStatus === 404) {
        return res.status(404).json(result);
      }
      res.json(result);
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
      const result = await mcpProxyService.readResource(serverId, uri);
      if (result.error?.includes('not found')) {
        return res.status(404).json(result);
      }
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ==========================================
  // BACKGROUND POLLING ENGINE CONTROLS
  // ==========================================

  router.get('/api/mcp/polling/status', (_req, res) => {
    res.json({ success: true, polling: mcpPollingEngine.getStatus() });
  });

  router.post('/api/mcp/polling/config', (req, res) => {
    try {
      const { enabled, intervalMs } = req.body || {};
      const polling = mcpPollingEngine.updateConfig({ enabled, intervalMs });
      res.json({ success: true, polling });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  router.post('/api/mcp/polling/trigger', async (_req, res) => {
    try {
      const payload = await mcpPollingEngine.triggerPollNow(false);
      res.json(payload);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ==========================================
  // PINNED WIDGETS & SOCIAL OUTLET PERSISTENCE
  // ==========================================

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
      const callRes = await mcpProxyService.callTool({ serverId, toolName, arguments: args, timeoutMs: 12000 });
      if (callRes.success) lastResult = callRes.data;

      const pin = upsertMcpPinnedWidget({ id, serverId, toolName, title, args, lastResult });
      res.json({ success: true, pin });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  router.delete('/api/mcp/pins/:id', (req, res) => {
    res.json({ success: deleteMcpPinnedWidget(req.params.id) });
  });

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

  // ==========================================
  // ALIGNMENT MATRIX LISTS, SORT ORDER & SHORT SYNC
  // ==========================================

  router.post('/api/studio/matrix/preference', (req, res) => {
    try {
      const { trackId, activeOverride, needsActionOverride, actionNote, manualRank } = req.body || {};
      if (!trackId) {
        return res.status(400).json({ success: false, error: 'trackId is required.' });
      }
      const record = upsertMatrixTrackPreference({
        trackId: String(trackId),
        activeOverride,
        needsActionOverride,
        actionNote,
        manualRank
      });
      res.json({
        success: true,
        record,
        matrixPreferences: listMatrixTrackPreferences()
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  router.post('/api/studio/matrix/bulk', (req, res) => {
    try {
      const { updates = [], resetAllToAuto = false } = req.body || {};
      const matrixPreferences = bulkSaveMatrixTrackPreferences(
        Array.isArray(updates) ? updates : [],
        Boolean(resetAllToAuto)
      );
      res.json({ success: true, matrixPreferences });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  router.post('/api/studio/matrix/reorder', (req, res) => {
    try {
      const { orderedTrackIds } = req.body || {};
      if (!Array.isArray(orderedTrackIds)) {
        return res.status(400).json({ success: false, error: 'orderedTrackIds array is required.' });
      }
      const matrixPreferences = saveMatrixSortOrderInSqlite(orderedTrackIds.map(String));
      const matrixSortMode = getMatrixSortModeFromSqlite();
      res.json({ success: true, matrixPreferences, matrixSortMode });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  router.post('/api/studio/matrix/sort-mode', (req, res) => {
    try {
      const sortMode = setMatrixSortModeInSqlite(String(req.body?.sortMode || 'manual'));
      res.json({ success: true, matrixSortMode: sortMode });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  router.post('/api/mcp/shorts/update-sync', async (req, res) => {
    try {
      const {
        shortId,
        trackId,
        trackSlug,
        trackTitle,
        campaign,
        status,
        title,
        hookText,
        caption,
        scheduledSlot,
        playlistId,
        youtubeId,
        youtubeUrl,
        spotifyUrl,
        appleMusicUrl,
        youtubeMusicUrl,
        canonicalMasterFile,
        videoAssetUrl,
        thumbnailAssetUrl,
        platformLinks,
        notes,
        outletUpdates = [],
        syncTargets = {}
      } = req.body || {};

      if (!shortId || !title) {
        return res.status(400).json({ success: false, error: 'shortId and title are required.' });
      }

      const normalizedPlatformLinks: Record<string, { status: string; postUrl: string; postId: string }> = {};
      if (platformLinks && typeof platformLinks === 'object' && !Array.isArray(platformLinks)) {
        for (const [k, v] of Object.entries(platformLinks as Record<string, any>)) {
          if (v && typeof v === 'object') {
            normalizedPlatformLinks[k] = {
              status: String(v.status || 'Not Started'),
              postUrl: String(v.postUrl || '').trim(),
              postId: String(v.postId || '').trim()
            };
          }
        }
      }

      if (Array.isArray(outletUpdates)) {
        for (const item of outletUpdates) {
          if (!item?.outletKey) continue;
          const key = String(item.outletKey);
          const fallbackUrl =
            key === 'youtube_shorts'
              ? String(youtubeUrl || '')
              : key === 'distro_streaming'
              ? String(spotifyUrl || appleMusicUrl || youtubeMusicUrl || '')
              : '';
          const fallbackId = key === 'youtube_shorts' ? String(youtubeId || '') : '';
          normalizedPlatformLinks[key] = {
            status: String(item.status || normalizedPlatformLinks[key]?.status || 'Not Started'),
            postUrl: String(item.postUrl ?? normalizedPlatformLinks[key]?.postUrl ?? fallbackUrl).trim(),
            postId: String(item.postId ?? normalizedPlatformLinks[key]?.postId ?? fallbackId).trim()
          };
        }
      }

      const willSyncRemote = Boolean(syncTargets.trackDb || syncTargets.approveRelease || syncTargets.museBridge);
      const savedOverride = upsertShortMetadataOverride({
        shortId: String(shortId),
        trackSlug: trackSlug ? String(trackSlug) : '',
        trackTitle: trackTitle ? String(trackTitle) : '',
        campaign: campaign ? String(campaign) : '',
        status: status ? String(status) : 'READY - UPDATED IN STUDIO',
        title: String(title),
        hookText: hookText !== undefined ? String(hookText) : '',
        caption: caption !== undefined ? String(caption) : '',
        scheduledSlot: scheduledSlot !== undefined ? String(scheduledSlot) : '',
        playlistId: playlistId ? String(playlistId) : '',
        youtubeId: youtubeId ? String(youtubeId) : '',
        youtubeUrl: youtubeUrl ? String(youtubeUrl) : '',
        spotifyUrl: spotifyUrl ? String(spotifyUrl) : '',
        appleMusicUrl: appleMusicUrl ? String(appleMusicUrl) : '',
        youtubeMusicUrl: youtubeMusicUrl ? String(youtubeMusicUrl) : '',
        canonicalMasterFile: canonicalMasterFile ? String(canonicalMasterFile) : '',
        videoAssetUrl: videoAssetUrl ? String(videoAssetUrl) : '',
        thumbnailAssetUrl: thumbnailAssetUrl ? String(thumbnailAssetUrl) : '',
        platformLinks: normalizedPlatformLinks,
        notes: notes !== undefined ? String(notes) : '',
        markSynced: willSyncRemote
      });

      if (trackId && Object.keys(normalizedPlatformLinks).length > 0) {
        for (const [outletKey, entry] of Object.entries(normalizedPlatformLinks)) {
          upsertSocialOutletStatus({
            trackId: String(trackId),
            outletKey,
            status: entry.status || 'Not Started',
            scheduledSlot: scheduledSlot ? String(scheduledSlot) : '',
            postUrl: entry.postUrl || '',
            postId: entry.postId || '',
            playlistId: playlistId ? String(playlistId) : '',
            notes: notes ? String(notes) : ''
          });
        }
      }

      const mcpPlatformLinks = Object.fromEntries(
        Object.entries(normalizedPlatformLinks).map(([key, entry]) => [
          key,
          {
            status: entry.status,
            post_url: entry.postUrl,
            post_id: entry.postId
          }
        ])
      );

      const serverId = String(syncTargets.serverId || 'brickos-primary-mcp');
      const syncResults: Array<{ target: string; ok: boolean; detail: string }> = [
        {
          target: 'Local SQLite Override',
          ok: Boolean(savedOverride),
          detail: savedOverride ? 'Saved metadata & all platform links locally.' : 'Failed writing SQLite override.'
        }
      ];

      if (syncTargets.trackDb && trackSlug) {
        const trackSyncRes = await mcpProxyService.callTool({
          serverId,
          toolName: 'brickos_track_sync',
          arguments: {
            track_slug: String(trackSlug),
            action: 'upsert',
            title: String(trackTitle || campaign || title),
            master_file: canonicalMasterFile ? String(canonicalMasterFile) : undefined,
            package: {
              short_id: String(shortId),
              title: String(title),
              hook_text: String(hookText || ''),
              caption: String(caption || ''),
              scheduled_slot: String(scheduledSlot || ''),
              playlist_id: String(playlistId || ''),
              youtube_id: String(youtubeId || ''),
              youtube_url: String(youtubeUrl || ''),
              spotify_url: String(spotifyUrl || ''),
              apple_music_url: String(appleMusicUrl || ''),
              youtube_music_url: String(youtubeMusicUrl || ''),
              platform_links: mcpPlatformLinks
            }
          }
        });
        syncResults.push({
          target: 'brickOS MCP Track DB',
          ok: trackSyncRes.success,
          detail: trackSyncRes.success
            ? `Synced metadata & platform URLs via brickos_track_sync (${trackSyncRes.latencyMs}ms).`
            : trackSyncRes.error || 'brickos_track_sync failed.'
        });
      }

      if (syncTargets.approveRelease && trackSlug && canonicalMasterFile) {
        const approveRes = await mcpProxyService.callTool({
          serverId,
          toolName: 'brickos_approve_release',
          arguments: {
            track_slug: String(trackSlug),
            short_cut: String(shortId),
            canonical_master_file: String(canonicalMasterFile),
            post_id: youtubeId ? String(youtubeId) : undefined,
            scheduled_slot: scheduledSlot ? String(scheduledSlot) : undefined,
            platform_links: mcpPlatformLinks,
            platforms: ['YouTube @brickRedeemed', 'TikTok @brickredeemed', 'IG @brickredeemed', 'IG @theknotcreations', 'Facebook Page']
          }
        });
        syncResults.push({
          target: 'Release Approval & Duplicate Guard',
          ok: approveRes.success,
          detail: approveRes.success
            ? `Validated canonical release stage (${approveRes.latencyMs}ms).`
            : approveRes.error || 'brickos_approve_release failed.'
        });
      } else if (syncTargets.approveRelease) {
        syncResults.push({
          target: 'Release Approval & Duplicate Guard',
          ok: false,
          detail: 'Skipped: canonicalMasterFile is required for brickos_approve_release.'
        });
      }

      if (syncTargets.museBridge) {
        const outletLinkSummary = Object.entries(normalizedPlatformLinks)
          .filter(([, entry]) => entry.postUrl || entry.postId)
          .map(([key, entry]) => `${key}: ${entry.postUrl || entry.postId}`)
          .join(' | ');

        const museMsg = [
          `Updated metadata for "${title}"`,
          hookText ? `Hook: "${hookText}"` : '',
          scheduledSlot ? `Slot: ${scheduledSlot}` : '',
          playlistId ? `Playlist: &list=${playlistId}` : '',
          outletLinkSummary,
          caption ? `Caption: ${String(caption).slice(0, 240)}` : ''
        ]
          .filter(Boolean)
          .join(' | ');

        const museRes = await mcpProxyService.callTool({
          serverId,
          toolName: 'brickos_muse_bridge',
          arguments: {
            action: 'send_directive',
            campaign: String(campaign || trackTitle || title),
            report_type: 'STATUS_UPDATE',
            message: museMsg,
            scheduled_items: [
              {
                short_id: String(shortId),
                title: String(title),
                scheduled_slot: String(scheduledSlot || ''),
                youtube_url: String(youtubeUrl || ''),
                spotify_url: String(spotifyUrl || ''),
                apple_music_url: String(appleMusicUrl || ''),
                tiktok_url: normalizedPlatformLinks.tiktok?.postUrl || '',
                tiktok_post_id: normalizedPlatformLinks.tiktok?.postId || '',
                instagram_url: normalizedPlatformLinks.instagram_reels?.postUrl || '',
                instagram_post_id: normalizedPlatformLinks.instagram_reels?.postId || '',
                facebook_x_url: normalizedPlatformLinks.facebook_x?.postUrl || '',
                facebook_x_post_id: normalizedPlatformLinks.facebook_x?.postId || '',
                platform_links: mcpPlatformLinks
              }
            ]
          }
        });
        syncResults.push({
          target: 'Meta Muse (Edison) Bridge',
          ok: museRes.success,
          detail: museRes.success
            ? `Dispatched updated schedule & platform links (${museRes.latencyMs}ms).`
            : museRes.error || 'brickos_muse_bridge failed.'
        });
      }

      res.json({
        success: true,
        override: savedOverride,
        shortOverrides: listShortMetadataOverrides(),
        outletStatuses: listSocialOutletStatuses(),
        syncResults
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Unified Dashboard Ingest Endpoint
  router.get('/api/mcp/dashboard-ingest', async (req, res) => {
    const forceCacheFallback = req.query.cacheOnly === '1';

    const enrichCachedPayload = (cachedPayload: any, updatedAt: string, extraErrors?: string[]) => {
      const shortOverrides = listShortMetadataOverrides();
      return {
        ...cachedPayload,
        readyShorts: mergeShortOverridesIntoShorts(cachedPayload.readyShorts || [], shortOverrides),
        outletStatuses: listSocialOutletStatuses(),
        shortOverrides,
        matrixPreferences: listMatrixTrackPreferences(),
        matrixSortMode: getMatrixSortModeFromSqlite(),
        servers: listMcpServersFromSqlite(false),
        authProfiles: listMcpAuthProfilesFromSqlite(false),
        polling: mcpPollingEngine.getStatus(),
        fromCache: true,
        cachedAt: updatedAt,
        ...(extraErrors ? { errors: extraErrors } : {})
      };
    };

    if (forceCacheFallback) {
      const cached = getMcpTelemetryCache('dashboard_ingest_v1');
      if (cached) {
        return res.json(enrichCachedPayload(cached.payload, cached.updatedAt));
      }
    }

    try {
      const payload = await mcpPollingEngine.triggerPollNow(false);
      res.json(payload);
    } catch (err: any) {
      const cached = getMcpTelemetryCache('dashboard_ingest_v1');
      if (cached) {
        return res.json(enrichCachedPayload(cached.payload, cached.updatedAt, [err.message]));
      }
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Pull deep per-project coordination telemetry from selected or primary MCP server
  router.post('/api/mcp/project-coordination', async (req, res) => {
    const start = Date.now();
    try {
      const trackSlug = String(req.body?.trackSlug || '').trim();
      const serverId = String(req.body?.serverId || 'brickos-primary-mcp').trim();
      if (!trackSlug) {
        return res.status(400).json({ success: false, error: 'trackSlug is required.' });
      }
      const server = getMcpServerByIdFromSqlite(serverId, true);
      if (!server || !server.enabled) {
        return res.status(404).json({ success: false, error: `MCP server '${serverId}' is disabled or missing.` });
      }

      const [trackGet, previewAssets, auditResult] = await Promise.all([
        mcpProxyService.callRpc(server, 'tools/call', { name: 'brickos_track_sync', arguments: { track_slug: trackSlug, action: 'get' } }, 12000),
        mcpProxyService.callRpc(server, 'tools/call', { name: 'brickos_preview_assets', arguments: { track_slug: trackSlug } }, 12000),
        mcpProxyService.callRpc(server, 'tools/call', { name: 'brickos_audit_playbook', arguments: { track_slug: trackSlug } }, 12000)
      ]);

      res.json({
        success: true,
        serverId,
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

      const prompt = `You are the brickOS Release Director coordinating audio masters, vertical Shorts, YouTube @brickRedeemed stats, Meta Muse (Edison IG/FB), TikTok, X, and Spotify/Apple (DistroKid).
Analyze the live operational snapshot below and provide a concise, high-signal 4-bullet Status Brief covering:
1) Immediate Action Required (e.g. Meta Muse v2 vs v5_clean corrections, IG manual cancellations, or Google Sheet sync),
2) YouTube & Shorts Velocity vs 10-post median baseline,
3) Daypart / Cohort readiness for Ready Shorts & active track "${activeTrackTitle}",
4) One focused coordination priority for today.

Keep every bullet concrete, reference real campaign names, dates, and numbers from the JSON only. Never invent fake metrics.

LIVE SNAPSHOT:
${JSON.stringify(snapshot).slice(0, 12000)}`;

      const candidates = ['gemini-4-hydrogen', 'gemini-3.1-flash-lite', 'gemini-3.1-pro-preview'];
      let briefText = '';
      let lastErr: any = null;
      for (const model of candidates) {
        try {
          const response = await ai.models.generateContent({ model, contents: prompt });
          if (response.text) {
            briefText = response.text;
            break;
          }
        } catch (e) {
          lastErr = e;
        }
      }

      if (!briefText) {
        throw lastErr || new Error('Gemini returned an empty brief.');
      }

      res.json({
        success: true,
        brief: briefText,
        generatedAt: new Date().toISOString()
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Gemini brief generation failed.' });
    }
  });

  return router;
}
