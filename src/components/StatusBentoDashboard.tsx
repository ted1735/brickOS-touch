import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  RefreshCw,
  Search,
  ExternalLink,
  Send,
  Sparkles,
  Youtube,
  Radio,
  Music2,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  ArrowRight,
  Plug,
  Copy,
  Clock,
  Edit3,
  SlidersHorizontal,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Archive,
  Pin,
  Check,
  Flag,
  Link2,
  X
} from 'lucide-react';
import { Track, CompositionSession } from '../types';
import {
  DashboardIngestPayload,
  ReadyShortItem,
  YouTubeVideoStat,
  MatrixSortMode,
  MatrixTrackPreference,
  SOCIAL_OUTLET_DEFINITIONS,
  OUTLET_STATUS_OPTIONS,
  CANONICAL_PLAYLISTS,
  getTelemetryWindowTag,
  toTrackSlug,
  isSafeExternalUrl,
  extractUrlFromText
} from '../types/mcpStatus';
import { CurrentProjectCoordinationPanel } from './CurrentProjectCoordinationPanel';
import { McpHubIngestionPanel } from './McpHubIngestionPanel';
import { StudioWorkspace, getSuggestedTrackStep } from './StudioHome';
import { ShortMetadataSyncModal, EditableShortPayload } from './ShortMetadataSyncModal';
import { CampaignListManagerModal, MatrixRowSummary } from './CampaignListManagerModal';

interface StatusBentoDashboardProps {
  tracks: Track[];
  selectedTrack: Track;
  sessions: CompositionSession[];
  onSelectTrack: (track: Track) => void;
  onContinueTrack: () => void;
  onOpenWorkspace: (workspace: StudioWorkspace, tab: string) => void;
  onNavigateToTab: (tab: string) => void;
  onCopyText: (text: string, label: string) => void;
  isDarkMode: boolean;
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

type BentoSubView = 'bento' | 'project' | 'mcp';

const lc = (v: unknown): string => String(v ?? '').toLowerCase();

const parseEffectiveDateInfo = (input: {
  shortSlot?: string;
  ytPublishedAt?: string;
  latestOutletUpdatedAt?: string;
}): { timestampMs: number; label: string } => {
  const candidates = [input.shortSlot, input.ytPublishedAt, input.latestOutletUpdatedAt];
  for (const raw of candidates) {
    const rawStr = String(raw || '').trim();
    if (!rawStr) continue;
    const parsed = Date.parse(rawStr);
    if (!Number.isNaN(parsed)) {
      const d = new Date(parsed);
      return {
        timestampMs: parsed,
        label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      };
    }
    const cleaned = rawStr
      .replace(/(\d+)(st|nd|rd|th)/gi, '$1')
      .replace(/\(.*?\)/g, '')
      .trim();
    const parsedWithYear = Date.parse(`${cleaned} ${new Date().getFullYear()}`);
    if (!Number.isNaN(parsedWithYear)) {
      const d = new Date(parsedWithYear);
      return {
        timestampMs: parsedWithYear,
        label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      };
    }
    return {
      timestampMs: 0,
      label: rawStr.length > 18 ? `${rawStr.slice(0, 16)}…` : rawStr
    };
  }
  return { timestampMs: 0, label: 'Unscheduled' };
};

export const StatusBentoDashboard: React.FC<StatusBentoDashboardProps> = ({
  tracks,
  selectedTrack,
  onSelectTrack,
  onContinueTrack,
  onNavigateToTab,
  onCopyText,
  isDarkMode,
  onNotify
}) => {
  const [subView, setSubView] = useState<BentoSubView>('bento');
  const [ingest, setIngest] = useState<DashboardIngestPayload | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [matrixFilter, setMatrixFilter] = useState<'active' | 'all' | 'issues'>('active');
  const [matrixSortMode, setMatrixSortMode] = useState<MatrixSortMode>('manual');
  const [editingShortTarget, setEditingShortTarget] = useState<EditableShortPayload | null>(null);
  const [isListManagerOpen, setIsListManagerOpen] = useState<boolean>(false);
  const [draggedTrackId, setDraggedTrackId] = useState<string | null>(null);
  const [editingOutletLink, setEditingOutletLink] = useState<{
    trackId: string;
    trackTitle: string;
    outletKey: string;
    outletLabel: string;
    status: string;
    postUrl: string;
    postId: string;
    scheduledSlot: string;
    cohort: string;
    playlistId: string;
  } | null>(null);

  // Gemini brief state (user-initiated)
  const [dailyBrief, setDailyBrief] = useState<string>('');
  const [isSynthesizingBrief, setIsSynthesizingBrief] = useState<boolean>(false);

  // Meta Muse (Edison) inline bridge controls
  const [museAction, setMuseAction] = useState<'request_stats_sync' | 'send_directive' | 'send_youtube_retention'>('request_stats_sync');
  const [museCampaign, setMuseCampaign] = useState<string>('The Milestone');
  const [museMessage, setMuseMessage] = useState<string>('');
  const [musePostId, setMusePostId] = useState<string>('');
  const [museWindow, setMuseWindow] = useState<'T+24h' | 'T+72h' | 'T+7d'>('T+72h');
  const [museStayedPct, setMuseStayedPct] = useState<string>('');
  const [museApvPct, setMuseApvPct] = useState<string>('');
  const [isSendingMuse, setIsSendingMuse] = useState<boolean>(false);

  // Image error tracking so broken external URLs fall back gracefully
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  // Background polling countdown state synced to backend McpPollingEngine
  const [secondsUntilNextPoll, setSecondsUntilNextPoll] = useState<number | null>(null);
  const [isUpdatingPolling, setIsUpdatingPolling] = useState<boolean>(false);

  const fetchDashboardIngest = async (silent = false, triggerPoll = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const endpoint = triggerPoll
        ? '/api/mcp/polling/trigger'
        : '/api/mcp/dashboard-ingest';
      const res = await fetch(endpoint, triggerPoll ? { method: 'POST' } : undefined);
      const data: DashboardIngestPayload = await res.json();
      if (!res.ok) {
        throw new Error((data as any)?.error || `Dashboard ingest failed (HTTP ${res.status})`);
      }
      if (data && data.success) {
        setIngest(data);
        if (data.matrixSortMode) setMatrixSortMode(data.matrixSortMode);
      }
    } catch (err: any) {
      if (!silent) onNotify(err?.message || 'MCP dashboard refresh failed', 'error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleUpdatePollingConfig = async (updates: { enabled?: boolean; intervalMs?: number }) => {
    setIsUpdatingPolling(true);
    try {
      const res = await fetch('/api/mcp/polling/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update polling config');
      }
      setIngest((prev) => (prev ? { ...prev, polling: data.polling } : prev));
      if (updates.enabled !== undefined) {
        onNotify(
          updates.enabled ? 'MCP Auto-Refresh Polling enabled.' : 'MCP Auto-Refresh Polling paused.',
          'info'
        );
      } else if (updates.intervalMs) {
        onNotify(`MCP polling interval set to ${Math.round(updates.intervalMs / 1000)}s.`, 'info');
      }
    } catch (err: any) {
      onNotify(err?.message || 'Polling config error', 'error');
    } finally {
      setIsUpdatingPolling(false);
    }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const cacheRes = await fetch('/api/mcp/dashboard-ingest?cacheOnly=1');
        if (cacheRes.ok) {
          const cachedData = await cacheRes.json();
          if (active && cachedData?.success) {
            setIngest(cachedData);
            if (cachedData.matrixSortMode) setMatrixSortMode(cachedData.matrixSortMode);
            setIsLoading(false);
          }
        }
      } catch {}
      if (active) {
        await fetchDashboardIngest(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Synchronized countdown + lightweight cache pull when background poller ticks
  useEffect(() => {
    const polling = ingest?.polling;
    if (!polling?.enabled) {
      setSecondsUntilNextPoll(null);
      return;
    }

    let triggeredEdgeRefresh = false;
    const tick = () => {
      if (!polling.nextPollAt) {
        setSecondsUntilNextPoll(Math.round((polling.intervalMs || 60000) / 1000));
        return;
      }
      const diffSec = Math.max(0, Math.ceil((new Date(polling.nextPollAt).getTime() - Date.now()) / 1000));
      setSecondsUntilNextPoll(diffSec);
      if (diffSec === 0 && !triggeredEdgeRefresh) {
        triggeredEdgeRefresh = true;
        setTimeout(() => {
          fetch('/api/mcp/dashboard-ingest?cacheOnly=1')
            .then((r) => (r.ok ? r.json() : null))
            .then((cached) => {
              if (cached?.success) setIngest(cached);
            })
            .catch(() => {});
        }, 1800);
      }
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [ingest?.polling?.enabled, ingest?.polling?.nextPollAt, ingest?.polling?.intervalMs]);

  const handleSaveOutletStatus = async (payload: {
    trackId: string;
    outletKey: string;
    status: string;
    scheduledSlot?: string;
    postUrl?: string;
    postId?: string;
    cohort?: string;
    playlistId?: string;
    notes?: string;
  }) => {
    try {
      const res = await fetch('/api/studio/outlet-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || !data.success || !data.record) {
        throw new Error(data?.error || `Failed to update outlet status (HTTP ${res.status})`);
      }
      setIngest((prev) => {
        if (!prev) return prev;
        const remaining = prev.outletStatuses.filter(
          (o) => !(o.trackId === payload.trackId && o.outletKey === payload.outletKey)
        );
        return {
          ...prev,
          outletStatuses: [data.record, ...remaining]
        };
      });
      onNotify(`Updated ${payload.outletKey.replace('_', ' ')} status to ${payload.status}`, 'success');
    } catch (err: any) {
      onNotify(err?.message || 'Failed to update outlet status', 'error');
    }
  };

  const handleSynthesizeBrief = async () => {
    if (!ingest) return;
    setIsSynthesizingBrief(true);
    try {
      const res = await fetch('/api/mcp/synthesize-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activeTrackTitle: selectedTrack?.title || '',
          snapshot: {
            youtube: ingest.youtube,
            readyShorts: ingest.readyShorts,
            metaMuseMessages: ingest.metaMuse?.messages?.slice(0, 6),
            googleSheet: ingest.googleSheet
          }
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDailyBrief(data.brief);
        onNotify('Generated Gemini live status brief from MCP telemetry.', 'success');
      } else {
        onNotify(data.error || `Could not synthesize brief (HTTP ${res.status})`, 'error');
      }
    } catch (err: any) {
      onNotify(err?.message || 'Brief synthesis error', 'error');
    } finally {
      setIsSynthesizingBrief(false);
    }
  };

  const handleSendToMuse = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingMuse(true);
    try {
      const args: Record<string, any> = {
        action: museAction,
        campaign: museCampaign.trim() || selectedTrack?.title || ''
      };
      if (museMessage.trim()) args.message = museMessage.trim();
      if (museAction === 'send_youtube_retention') {
        if (!musePostId.trim()) {
          onNotify('Enter a YouTube video_id or post_id for retention submission.', 'error');
          setIsSendingMuse(false);
          return;
        }
        args.post_id = musePostId.trim();
        args.window = museWindow;
        if (museStayedPct) args.stayed_to_watch_pct = Number(museStayedPct);
        if (museApvPct) args.apv_pct = Number(museApvPct);
      }

      const res = await fetch('/api/mcp/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serverId: 'brickos-primary-mcp',
          toolName: 'brickos_muse_bridge',
          arguments: args
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMuseMessage('');
        onNotify('Dispatched update to Edison (Meta Muse) via MCP.', 'success');
        await fetchDashboardIngest(true);
      } else {
        onNotify(data.error || `Muse bridge call failed (HTTP ${res.status})`, 'error');
      }
    } catch (err: any) {
      onNotify(err?.message || 'Failed contacting Muse', 'error');
    } finally {
      setIsSendingMuse(false);
    }
  };

  const handleOpenProjectCoordination = (trackTitleOrSlug: string) => {
    const q = lc(trackTitleOrSlug);
    const safeTracks = (Array.isArray(tracks) ? tracks : []).filter((t): t is Track => Boolean(t));
    const matched =
      safeTracks.find(
        (t) =>
          lc(t.title) === q ||
          (q && toTrackSlug(t.title) === toTrackSlug(q)) ||
          (q && lc(t.title).includes(q)) ||
          (lc(t.title) && q.includes(lc(t.title)))
      ) || selectedTrack;
    if (matched) onSelectTrack(matched);
    setSubView('project');
  };

  const handleOpenShortEditor = (shortItem: ReadyShortItem) => {
    const shortTitleLc = lc(shortItem.track || shortItem.campaign || shortItem.title);
    const matchedTrack =
      (Array.isArray(tracks) ? tracks : []).find(
        (t) =>
          t &&
          (lc(t.title) === lc(shortItem.track) ||
            lc(t.title) === lc(shortItem.campaign) ||
            (shortTitleLc && shortTitleLc.includes(lc(t.title))))
      ) || null;
    const liveVideo =
      (ingest?.youtube?.videos || []).find(
        (v) =>
          (shortItem.youtube_id && v.video_id === shortItem.youtube_id) ||
          (shortTitleLc && lc(v.title).includes(shortTitleLc))
      ) || null;
    setEditingShortTarget({ short: shortItem, liveVideo, matchedTrack });
  };

  const handleOpenLiveVideoEditor = (video: YouTubeVideoStat) => {
    const vidTitleLc = lc(video.title);
    const readyShortsList = Array.isArray(ingest?.readyShorts) ? ingest.readyShorts : [];
    const matchedShort = readyShortsList.find(
      (s) =>
        (s.youtube_id && s.youtube_id === video.video_id) ||
        (lc(s.title) && vidTitleLc.includes(lc(s.title))) ||
        (lc(s.track) && vidTitleLc.includes(lc(s.track)))
    );
    const matchedTrack =
      (Array.isArray(tracks) ? tracks : []).find(
        (t) => t && lc(t.title) && vidTitleLc.includes(lc(t.title))
      ) || null;

    if (matchedShort) {
      setEditingShortTarget({ short: matchedShort, liveVideo: video, matchedTrack });
      return;
    }

    const synthesizedShort: ReadyShortItem = {
      id: `yt-${video.video_id}`,
      campaign: matchedTrack?.title || video.title,
      track: matchedTrack?.title || '',
      status: video.privacy_status === 'private' ? 'PRIVATE / STAGED ON YOUTUBE' : 'LIVE ON YOUTUBE',
      title: video.title,
      youtube_id: video.video_id,
      youtube_url: video.url,
      spotify_url: ingest?.releaseLinks?.spotify_track || '',
      apple_music_url: ingest?.releaseLinks?.apple_music || '',
      youtube_music_url: ingest?.releaseLinks?.youtube_music || '',
      scheduled_slot: video.published_at
        ? new Date(video.published_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
        : '',
      format: '9:16 YouTube Short',
      duration: video.duration_iso || 'Short'
    };
    setEditingShortTarget({ short: synthesizedShort, liveVideo: video, matchedTrack });
  };

  const handleUpdateMatrixPreference = async (payload: {
    trackId: string;
    activeOverride?: 'auto' | 'pinned' | 'archived';
    needsActionOverride?: 'auto' | 'flagged' | 'cleared';
    actionNote?: string;
  }) => {
    try {
      const res = await fetch('/api/studio/matrix/preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error || 'Failed updating list assignment');
      }
      setIngest((prev) =>
        prev ? { ...prev, matrixPreferences: data.matrixPreferences || [] } : prev
      );
      onNotify('Updated campaign list status.', 'success');
    } catch (err: any) {
      onNotify(err?.message || 'Failed updating campaign preference', 'error');
    }
  };

  const handleChangeSortMode = async (nextMode: MatrixSortMode) => {
    setMatrixSortMode(nextMode);
    try {
      await fetch('/api/studio/matrix/sort-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sortMode: nextMode })
      });
    } catch {}
  };

  // Merge catalog tracks + MCP tracks + Ready Shorts + Matrix Preferences into sortable rows
  const allMatrixRows = useMemo(() => {
    const safeTracks = (Array.isArray(tracks) ? tracks : []).filter((t): t is Track => Boolean(t));
    const readyShorts = Array.isArray(ingest?.readyShorts) ? ingest.readyShorts.filter(Boolean) : [];
    const mcpTracks = Array.isArray(ingest?.mcpTracks) ? ingest.mcpTracks.filter(Boolean) : [];
    const ytVideos = Array.isArray(ingest?.youtube?.videos) ? ingest.youtube.videos.filter(Boolean) : [];
    const outletStatuses = Array.isArray(ingest?.outletStatuses) ? ingest.outletStatuses.filter(Boolean) : [];
    const museMsgs = Array.isArray(ingest?.metaMuse?.messages) ? ingest.metaMuse.messages.filter(Boolean) : [];
    const prefsList = Array.isArray(ingest?.matrixPreferences) ? ingest.matrixPreferences.filter(Boolean) : [];
    const prefByTrackId = new Map<string, MatrixTrackPreference>();
    for (const p of prefsList) {
      if (p?.trackId) prefByTrackId.set(p.trackId, p);
    }

    const built = safeTracks.map((t, catalogIdx) => {
      const titleLc = lc(t.title);
      const slug = toTrackSlug(t.title);
      const mcpMatch = mcpTracks.find(
        (m) => (m?.slug && m.slug === slug) || (titleLc && lc(m?.title) === titleLc)
      );
      const shortMatch = readyShorts.find(
        (s) =>
          (titleLc && lc(s?.track) === titleLc) ||
          (titleLc && lc(s?.campaign) === titleLc)
      );
      const ytMatch = ytVideos.find((v) =>
        Boolean(titleLc && lc(v?.title).includes(titleLc))
      );
      const museMatch = museMsgs.find(
        (m) =>
          Boolean(titleLc && lc(m?.campaign).includes(titleLc)) ||
          Boolean(titleLc && lc(m?.message).includes(titleLc))
      );

      const getOutlet = (outletKey: string) => {
        const saved = outletStatuses.find(
          (o) => o?.trackId === t.id && o?.outletKey === outletKey
        );
        const fromShortLink = shortMatch?.platform_links?.[outletKey];
        const museUrl = extractUrlFromText(museMatch?.message);
        const museUrlLc = lc(museUrl);

        let fallbackPostUrl = fromShortLink?.postUrl || '';
        let fallbackPostId = fromShortLink?.postId || '';

        if (!fallbackPostUrl) {
          if (outletKey === 'youtube_shorts') {
            fallbackPostUrl = ytMatch?.url || shortMatch?.youtube_url || '';
          } else if (outletKey === 'distro_streaming') {
            fallbackPostUrl =
              shortMatch?.spotify_url ||
              shortMatch?.apple_music_url ||
              shortMatch?.youtube_music_url ||
              '';
          } else if (outletKey === 'instagram_reels' && museUrlLc.includes('instagram.com')) {
            fallbackPostUrl = museUrl;
          } else if (
            outletKey === 'facebook_x' &&
            (museUrlLc.includes('facebook.com') || museUrlLc.includes('fb.com') || museUrlLc.includes('x.com'))
          ) {
            fallbackPostUrl = museUrl;
          } else if (outletKey === 'tiktok' && museUrlLc.includes('tiktok.com')) {
            fallbackPostUrl = museUrl;
          }
        }

        if (!fallbackPostId && outletKey === 'youtube_shorts') {
          fallbackPostId = ytMatch?.video_id || shortMatch?.youtube_id || '';
        }

        if (saved) {
          return {
            ...saved,
            postUrl: saved.postUrl || fallbackPostUrl,
            postId: saved.postId || fallbackPostId,
            scheduledSlot: saved.scheduledSlot || shortMatch?.scheduled_slot || ''
          };
        }

        let derivedStatus = fromShortLink?.status || 'Not Started';
        const museMsgLc = lc(museMatch?.message);
        if (derivedStatus === 'Not Started') {
          if (outletKey === 'youtube_shorts') {
            if (ytMatch) derivedStatus = 'Published';
            else if (shortMatch) derivedStatus = 'Scheduled';
            else if (mcpMatch?.status === 'Published') derivedStatus = 'Published';
          } else if (outletKey === 'instagram_reels' || outletKey === 'facebook_x') {
            if (museMsgLc.includes('cancel')) derivedStatus = 'Needs Correction';
            else if (museMsgLc.includes('published')) derivedStatus = 'Published';
            else if (museMsgLc.includes('scheduled') || shortMatch) derivedStatus = 'Scheduled';
          } else if (outletKey === 'distro_streaming') {
            if (shortMatch?.spotify_url || mcpMatch?.status === 'Published' || t.status === 'Released') {
              derivedStatus = 'Published';
            }
          }
        }
        return {
          trackId: t.id,
          outletKey,
          status: derivedStatus,
          scheduledSlot: shortMatch?.scheduled_slot || '',
          postUrl: fallbackPostUrl,
          postId: fallbackPostId,
          cohort: 'Cohort C',
          playlistId: CANONICAL_PLAYLISTS[0].id,
          notes: '',
          updatedAt: ''
        };
      };

      const outlets = SOCIAL_OUTLET_DEFINITIONS.map((def) => ({
        def,
        rec: getOutlet(def.key)
      }));

      const autoHasIssue = outlets.some(
        (o) => o.rec.status === 'Needs Correction' || o.rec.status === 'Vetoed / Pulled'
      );
      const autoActive =
        Boolean(shortMatch) ||
        Boolean(ytMatch) ||
        Boolean(museMatch) ||
        (selectedTrack?.id ? t.id === selectedTrack.id : false) ||
        mcpMatch?.status === 'Published' ||
        mcpMatch?.status === 'In Progress' ||
        outlets.some((o) => o.rec.status !== 'Not Started');

      const pref = prefByTrackId.get(t.id);
      const effectiveActive =
        pref?.activeOverride === 'pinned'
          ? true
          : pref?.activeOverride === 'archived'
          ? false
          : autoActive;
      const effectiveNeedsAction =
        pref?.needsActionOverride === 'flagged'
          ? true
          : pref?.needsActionOverride === 'cleared'
          ? false
          : autoHasIssue;

      const completedCount = outlets.filter((o) =>
        o.rec.status === 'Published' ||
        o.rec.status === 'Scheduled' ||
        o.rec.status === 'Audit Passed'
      ).length;
      const completionPct = Math.round((completedCount / Math.max(1, outlets.length)) * 100);

      const latestOutletUpdatedAt = outlets
        .map((o) => o.rec.updatedAt)
        .filter(Boolean)
        .sort()
        .reverse()[0];
      const dateInfo = parseEffectiveDateInfo({
        shortSlot: shortMatch?.scheduled_slot || outlets.find((o) => o.rec.scheduledSlot)?.rec.scheduledSlot,
        ytPublishedAt: ytMatch?.published_at,
        latestOutletUpdatedAt
      });

      return {
        track: t,
        slug: mcpMatch?.slug || slug,
        mcpStatus: mcpMatch?.status || t.status || 'Concept',
        shortMatch,
        ytMatch,
        museMatch,
        outlets,
        pref,
        autoHasIssue,
        autoActive,
        hasIssue: effectiveNeedsAction,
        isActiveCampaign: effectiveActive,
        completedCount,
        totalOutlets: outlets.length,
        completionPct,
        effectiveDateMs: dateInfo.timestampMs,
        effectiveDateLabel: dateInfo.label,
        manualRank: typeof pref?.manualRank === 'number' && pref.manualRank < 9999 ? pref.manualRank : 1000 + catalogIdx
      };
    });

    const sorted = [...built];
    sorted.sort((a, b) => {
      switch (matrixSortMode) {
        case 'date_desc':
          return b.effectiveDateMs - a.effectiveDateMs || a.manualRank - b.manualRank;
        case 'date_asc': {
          const aScore = a.effectiveDateMs || Number.MAX_SAFE_INTEGER;
          const bScore = b.effectiveDateMs || Number.MAX_SAFE_INTEGER;
          return aScore - bScore || a.manualRank - b.manualRank;
        }
        case 'completion_desc':
          return b.completionPct - a.completionPct || b.completedCount - a.completedCount || a.manualRank - b.manualRank;
        case 'completion_asc':
          return a.completionPct - b.completionPct || a.completedCount - b.completedCount || a.manualRank - b.manualRank;
        case 'manual':
        default:
          return a.manualRank - b.manualRank;
      }
    });

    return sorted;
  }, [tracks, ingest, selectedTrack?.id, matrixSortMode]);

  const activeCampaignCount = allMatrixRows.filter((r) => r.isActiveCampaign).length;
  const needsActionCount = allMatrixRows.filter((r) => r.hasIssue).length;

  const alignmentRows = useMemo(() => {
    return allMatrixRows.filter((row) => {
      if (matrixFilter === 'active' && !row.isActiveCampaign) return false;
      if (matrixFilter === 'issues' && !row.hasIssue) return false;
      if (searchQuery.trim()) {
        const q = lc(searchQuery);
        return (
          lc(row.track?.title).includes(q) ||
          lc(row.track?.id).includes(q) ||
          lc(row.track?.ep).includes(q) ||
          lc(row.slug).includes(q)
        );
      }
      return true;
    });
  }, [allMatrixRows, matrixFilter, searchQuery]);

  const persistManualTrackOrder = async (orderedIds: string[]) => {
    setMatrixSortMode('manual');
    // Optimistically update ingest matrixPreferences for instant UI response
    setIngest((prev) => {
      if (!prev) return prev;
      const existing = new Map((prev.matrixPreferences || []).map((p) => [p.trackId, p]));
      const now = new Date().toISOString();
      const updated = orderedIds.map((trackId, index) => {
        const cur = existing.get(trackId);
        return {
          trackId,
          activeOverride: cur?.activeOverride || ('auto' as const),
          needsActionOverride: cur?.needsActionOverride || ('auto' as const),
          actionNote: cur?.actionNote || '',
          manualRank: index,
          updatedAt: now
        };
      });
      return { ...prev, matrixSortMode: 'manual', matrixPreferences: updated };
    });

    try {
      const res = await fetch('/api/studio/matrix/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedTrackIds: orderedIds })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIngest((prev) =>
          prev
            ? {
                ...prev,
                matrixPreferences: data.matrixPreferences || prev.matrixPreferences,
                matrixSortMode: data.matrixSortMode || 'manual'
              }
            : prev
        );
      }
    } catch {}
  };

  const handleMoveTrackRow = (trackId: string, direction: 'up' | 'down') => {
    const visibleIds = alignmentRows.map((r) => r.track.id);
    const idx = visibleIds.indexOf(trackId);
    if (idx < 0) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= visibleIds.length) return;

    const fullIds = allMatrixRows.map((r) => r.track.id);
    const fullA = fullIds.indexOf(visibleIds[idx]);
    const fullB = fullIds.indexOf(visibleIds[swapIdx]);
    if (fullA < 0 || fullB < 0) return;

    const reordered = [...fullIds];
    const [moved] = reordered.splice(fullA, 1);
    reordered.splice(fullB, 0, moved);
    persistManualTrackOrder(reordered);
  };

  const handleDropReorder = (sourceTrackId: string, targetTrackId: string) => {
    if (!sourceTrackId || sourceTrackId === targetTrackId) return;
    const fullIds = allMatrixRows.map((r) => r.track.id);
    const srcIdx = fullIds.indexOf(sourceTrackId);
    const tgtIdx = fullIds.indexOf(targetTrackId);
    if (srcIdx < 0 || tgtIdx < 0) return;

    const reordered = [...fullIds];
    const [moved] = reordered.splice(srcIdx, 1);
    reordered.splice(tgtIdx, 0, moved);
    persistManualTrackOrder(reordered);
  };

  const listManagerSummaries: MatrixRowSummary[] = useMemo(
    () =>
      allMatrixRows.map((r) => ({
        track: r.track,
        autoActive: r.autoActive,
        autoHasIssue: r.autoHasIssue,
        effectiveActive: r.isActiveCampaign,
        effectiveNeedsAction: r.hasIssue,
        pref: r.pref
      })),
    [allMatrixRows]
  );

  const cardSurface = isDarkMode
    ? 'bg-slate-900/90 border-slate-800 text-slate-100'
    : 'bg-white border-slate-200 text-slate-900';
  const subSurface = isDarkMode
    ? 'bg-slate-950/80 border-slate-800 text-slate-200'
    : 'bg-slate-50 border-slate-200 text-slate-800';
  const mutedText = isDarkMode ? 'text-slate-400' : 'text-slate-600';

  const statusToneClass = (status: string) => {
    switch (status) {
      case 'Published':
        return 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';
      case 'Scheduled':
      case 'Audit Passed':
        return 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10';
      case 'Drafting':
        return 'text-indigo-400 border-indigo-500/40 bg-indigo-500/10';
      case 'Needs Correction':
      case 'Vetoed / Pulled':
        return 'text-rose-400 border-rose-500/40 bg-rose-500/10';
      default:
        return isDarkMode
          ? 'text-slate-400 border-slate-700 bg-slate-900'
          : 'text-slate-600 border-slate-300 bg-white';
    }
  };

  const nextStep = getSuggestedTrackStep(selectedTrack);
  const yt = ingest?.youtube;
  const museMessages = Array.isArray(ingest?.metaMuse?.messages) ? ingest.metaMuse.messages.filter(Boolean) : [];
  const readyShorts = Array.isArray(ingest?.readyShorts) ? ingest.readyShorts.filter(Boolean) : [];
  const servers = Array.isArray(ingest?.servers) ? ingest.servers.filter(Boolean) : [];
  const connectedServerCount = servers.filter((s) => s.lastStatus === 'connected').length;

  const filteredShorts = readyShorts.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = lc(searchQuery);
    return (
      lc(s?.title).includes(q) ||
      lc(s?.campaign).includes(q) ||
      lc(s?.track).includes(q) ||
      lc(s?.id).includes(q)
    );
  });

  const filteredMuseMessages = museMessages.filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = lc(searchQuery);
    return (
      lc(m?.campaign).includes(q) ||
      lc(m?.message).includes(q) ||
      lc(m?.agent).includes(q)
    );
  });

  const polling = ingest?.polling;

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-5 pb-6">
      {/* TOP COMMAND HEADER: VIEW SWITCHER + AUTO-POLLING + LIVE MCP SYNC */}
      <section className={`rounded-2xl border p-4 sm:p-5 ${cardSurface}`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="min-w-0">
            <div className={`text-xs font-mono flex flex-wrap items-center gap-1.5 ${mutedText}`}>
              <span>brick · @brickRedeemed · {connectedServerCount}/{servers.length || 1} MCP Servers Active</span>
              {ingest?.fetchedAt && <span>· Synced {new Date(ingest.fetchedAt).toLocaleTimeString()}</span>}
              {ingest?.fromCache && <span>· Cached</span>}
              {polling && (
                <span className="inline-flex items-center gap-1 text-cyan-400 tabular-nums">
                  <span>·</span>
                  <Clock className="w-3 h-3" />
                  {polling.enabled
                    ? polling.isPolling
                      ? 'Polling now...'
                      : `Auto-poll ${secondsUntilNextPoll ?? Math.round((polling.intervalMs || 60000) / 1000)}s`
                    : 'Auto-poll paused'}
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight mt-0.5">
              brickOS Production, Shorts &amp; Social Status
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Segmented Mode Switcher */}
            <div
              className={`flex items-center p-1 rounded-xl border ${
                isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
              }`}
            >
              {[
                { id: 'bento' as BentoSubView, label: 'Global Status Bento' },
                { id: 'project' as BentoSubView, label: 'Current Project' },
                { id: 'mcp' as BentoSubView, label: `MCP Hub (${servers.length || 1})` }
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSubView(tab.id)}
                  className={`min-h-[40px] px-3 sm:px-4 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
                    subView === tab.id
                      ? 'bg-indigo-600 text-white'
                      : isDarkMode
                      ? 'text-slate-400 hover:text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Auto-Refresh Polling Interval + Pause/Resume */}
            <div className="flex items-center gap-1.5">
              <select
                value={polling?.intervalMs || 60000}
                disabled={isUpdatingPolling}
                onChange={(e) => handleUpdatePollingConfig({ intervalMs: Number(e.target.value) })}
                aria-label="MCP auto-refresh polling interval"
                className={`min-h-[44px] px-2.5 py-2 rounded-xl border text-xs font-mono cursor-pointer ${
                  isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-white border-slate-300 text-slate-900'
                }`}
              >
                <option value={30000}>Poll 30s</option>
                <option value={60000}>Poll 60s</option>
                <option value={120000}>Poll 2m</option>
                <option value={300000}>Poll 5m</option>
              </select>
              <button
                type="button"
                disabled={isUpdatingPolling}
                onClick={() => handleUpdatePollingConfig({ enabled: !(polling?.enabled ?? true) })}
                title={polling?.enabled ? 'Pause background auto-polling' : 'Resume background auto-polling'}
                className={`min-h-[44px] min-w-[44px] px-2.5 py-2 rounded-xl border text-xs font-medium flex items-center justify-center cursor-pointer ${
                  isDarkMode ? 'bg-slate-950 border-slate-800 hover:bg-slate-900 text-slate-200' : 'bg-white border-slate-300 hover:bg-slate-50 text-slate-800'
                }`}
              >
                {polling?.enabled ?? true ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
              </button>
            </div>

            <button
              type="button"
              onClick={() => fetchDashboardIngest(false, true)}
              disabled={isRefreshing}
              className={`min-h-[44px] px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0 ${
                isDarkMode
                  ? 'bg-slate-950 border-slate-700 hover:border-cyan-500/60 text-cyan-300'
                  : 'bg-white border-slate-300 hover:bg-slate-50 text-cyan-700'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Syncing MCP...' : 'Sync MCP'}</span>
            </button>

            <button
              type="button"
              onClick={handleSynthesizeBrief}
              disabled={isSynthesizingBrief || !ingest}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isSynthesizingBrief ? 'Synthesizing...' : 'Daily Brief'}</span>
            </button>
          </div>
        </div>

        {/* Streamlined Filter Bar + Primary Next Action */}
        <div className="mt-4 pt-3.5 border-t border-slate-800/40 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${mutedText}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter campaigns, tracks, Shorts, Muse updates, or IDs..."
              className={`w-full min-h-[42px] pl-9 pr-3 py-2 rounded-xl border text-xs ${
                isDarkMode
                  ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500'
                  : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
              }`}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className={`text-xs ${mutedText}`}>
              Active Track: <strong className={isDarkMode ? 'text-white' : 'text-slate-900'}>{selectedTrack?.id || '—'} · {selectedTrack?.title || 'Untitled'}</strong>
            </span>
            <button
              type="button"
              onClick={onContinueTrack}
              className="min-h-[40px] px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <span>{nextStep.label}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Optional Gemini Status Brief Output */}
        {dailyBrief && (
          <div className={`mt-4 rounded-xl border p-4 space-y-2 ${subSurface}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-indigo-400">Gemini Executive Operations Brief</span>
              <button
                type="button"
                onClick={() => setDailyBrief('')}
                className={`text-xs hover:underline cursor-pointer ${mutedText}`}
              >
                Dismiss
              </button>
            </div>
            <div className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">{dailyBrief}</div>
          </div>
        )}

        {ingest?.errors && ingest.errors.length > 0 && (
          <div className="mt-3 p-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-300 text-xs font-mono">
            Partial MCP notices: {ingest.errors.join(' · ')}
          </div>
        )}
      </section>

      {/* SUBVIEW ROUTING */}
      {subView === 'project' ? (
        <CurrentProjectCoordinationPanel
          tracks={tracks}
          selectedTrack={selectedTrack}
          onSelectTrack={onSelectTrack}
          servers={servers}
          mcpTracks={ingest?.mcpTracks || []}
          readyShorts={readyShorts}
          museMessages={museMessages}
          outletStatuses={ingest?.outletStatuses || []}
          isDarkMode={isDarkMode}
          onSaveOutletStatus={handleSaveOutletStatus}
          onNavigateToTab={onNavigateToTab}
          onNotify={onNotify}
        />
      ) : subView === 'mcp' ? (
        <McpHubIngestionPanel
          servers={servers}
          pinnedWidgets={ingest?.pinnedWidgets || []}
          authProfiles={ingest?.authProfiles || []}
          progressMarkdown={ingest?.progressMarkdown || ''}
          isDarkMode={isDarkMode}
          onRefreshDashboard={() => fetchDashboardIngest(false, true)}
          onNotify={onNotify}
        />
      ) : (
        /* GLOBAL STATUS BENTO VIEW */
        <div className="space-y-5">
          {/* BENTO ROW 1: YOUTUBE LIVE STATS + META MUSE (EDISON) */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
            {/* TILE A: YOUTUBE @brickRedeemed LIVE STATS & VIDEO VELOCITY (7 cols) */}
            <section className={`xl:col-span-7 rounded-2xl border p-4 sm:p-5 flex flex-col justify-between gap-4 ${cardSurface}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm sm:text-base font-bold flex items-center gap-2">
                    <Youtube className="w-4 h-4 text-rose-500" />
                    <span>YouTube Channel & Shorts Velocity ({yt?.channel?.handle || '@brickRedeemed'})</span>
                  </h3>
                  <p className={`text-xs mt-0.5 ${mutedText}`}>
                    Live YouTube Data API v3 · Baseline benchmark = rolling 10-post median ({yt?.summary?.rolling_median_views ?? '—'} views)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigateToTab('youtube')}
                  className={`min-h-[38px] px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer ${subSurface}`}
                >
                  Open YT Packaging
                </button>
              </div>

              {isLoading && !yt ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-pulse">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className={`h-20 rounded-xl border ${subSurface}`} />
                  ))}
                </div>
              ) : yt ? (
                <>
                  {/* 4 Tabular KPI Blocks */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className={`rounded-xl border p-3 ${subSurface}`}>
                      <div className={`text-[11px] ${mutedText}`}>Subscribers</div>
                      <div className="text-xl font-bold font-mono tabular-nums mt-0.5">
                        {(yt.channel?.subscribers ?? 0).toLocaleString()}
                      </div>
                    </div>
                    <div className={`rounded-xl border p-3 ${subSurface}`}>
                      <div className={`text-[11px] ${mutedText}`}>Total Views · {yt.channel?.video_count ?? 0} Videos</div>
                      <div className="text-xl font-bold font-mono tabular-nums mt-0.5">
                        {(yt.channel?.total_views ?? 0).toLocaleString()}
                      </div>
                    </div>
                    <div className={`rounded-xl border p-3 ${subSurface}`}>
                      <div className={`text-[11px] ${mutedText}`}>10-Post Median</div>
                      <div className="text-xl font-bold font-mono tabular-nums text-cyan-400 mt-0.5">
                        {(yt.summary?.rolling_median_views ?? 0).toLocaleString()}
                      </div>
                    </div>
                    <div className={`rounded-xl border p-3 ${subSurface}`}>
                      <div className={`text-[11px] ${mutedText}`}>Avg Like / View</div>
                      <div className="text-xl font-bold font-mono tabular-nums text-emerald-400 mt-0.5">
                        {yt.summary?.avg_like_to_view_pct ?? 0}%
                      </div>
                    </div>
                  </div>

                  {/* Recent Videos Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className={`border-b text-[11px] font-mono ${isDarkMode ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
                          <th className="py-2 pr-3 font-medium">Video / Short</th>
                          <th className="py-2 px-2 text-right font-medium">Views</th>
                          <th className="py-2 px-2 text-right font-medium">Likes</th>
                          <th className="py-2 px-2 text-right font-medium">L/V %</th>
                          <th className="py-2 pl-2 text-right font-medium">Window</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40 text-xs">
                        {(yt.videos || []).slice(0, 6).map((v) => {
                          const win = getTelemetryWindowTag(v.published_at);
                          const isBreakoutEcho = (v.views ?? 0) >= 400;
                          return (
                            <tr
                              key={v.video_id}
                              onClick={() => handleOpenLiveVideoEditor(v)}
                              title="Click to edit Short metadata & sync platforms"
                              className={`cursor-pointer transition group ${
                                isDarkMode ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'
                              }`}
                            >
                              <td className="py-2 pr-3 max-w-[260px]">
                                <div className="font-medium truncate flex items-center gap-1.5 group-hover:text-indigo-400 transition-colors">
                                  <span className="truncate">{v.title}</span>
                                  <Edit3 className="w-3 h-3 opacity-0 group-hover:opacity-100 shrink-0 text-indigo-400" />
                                </div>
                                <div className={`text-[11px] font-mono ${mutedText}`}>
                                  {v.video_id} · {v.duration_iso || 'Short'}
                                  {isBreakoutEcho ? ' · Breakout (>400 views)' : ''}
                                </div>
                              </td>
                              <td className="py-2 px-2 text-right font-mono tabular-nums font-semibold">
                                {(v.views ?? 0).toLocaleString()}
                              </td>
                              <td className="py-2 px-2 text-right font-mono tabular-nums">
                                {(v.likes ?? 0).toLocaleString()}
                              </td>
                              <td className="py-2 px-2 text-right font-mono tabular-nums text-emerald-400">
                                {v.like_to_view_pct ?? 0}%
                              </td>
                              <td className="py-2 pl-2 text-right font-mono text-[11px] whitespace-nowrap">
                                <span
                                  className={
                                    win.tone === 'amber'
                                      ? 'text-amber-400'
                                      : win.tone === 'emerald'
                                      ? 'text-emerald-400'
                                      : win.tone === 'cyan'
                                      ? 'text-cyan-400'
                                      : mutedText
                                  }
                                >
                                  {win.label}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className={`rounded-xl border p-6 text-center text-xs ${subSurface}`}>
                  Unable to load YouTube channel telemetry yet. Verify `https://brick-mcp.moyercloud.com/mcp` in the MCP Hub tab.
                </div>
              )}
            </section>

            {/* TILE B: META MUSE (EDISON) TWO-WAY BRIDGE & SHEET SYNC (5 cols) */}
            <section className={`xl:col-span-5 rounded-2xl border p-4 sm:p-5 flex flex-col justify-between gap-4 ${cardSurface}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm sm:text-base font-bold flex items-center gap-2">
                    <Radio className="w-4 h-4 text-indigo-400" />
                    <span>Meta Muse (Edison) · IG & Facebook</span>
                  </h3>
                  <p className={`text-xs mt-0.5 ${mutedText}`}>
                    @brickredeemed · @theknotcreations · FB Page · {ingest?.metaMuse?.totalMessages || 0} reports logged
                  </p>
                </div>
                {ingest?.googleSheet?.sheet_url && (
                  <a
                    href={ingest.googleSheet.sheet_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`min-h-[36px] px-2.5 py-1.5 rounded-lg border text-[11px] font-medium inline-flex items-center gap-1 ${subSurface}`}
                  >
                    <span>Tracker Sheet</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {/* Google Sheet Auth Notice if 401 */}
              {ingest?.googleSheet?.status === 'SHEET_AUTH_REQUIRED' && (
                <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs space-y-1">
                  <div className="font-semibold text-amber-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>Google Sheet &quot;brick - Post Tracker&quot; Needs Access or Muse Push</span>
                  </div>
                  <p className="text-amber-200/80 leading-relaxed">
                    {ingest.googleSheet.how_to_unlock || 'Set Sheet to Anyone with link can view or ask Edison to push tracker rows.'}
                  </p>
                </div>
              )}

              {/* Latest Edison Reports */}
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {filteredMuseMessages.slice(0, 5).map((msg, idx) => (
                  <div key={idx} className={`rounded-xl border p-3 text-xs space-y-1 ${subSurface}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-indigo-400">
                        {msg.agent} · {msg.campaign || 'General'}
                      </span>
                      <span className={`font-mono text-[10px] ${mutedText}`}>
                        {msg.report_type}
                      </span>
                    </div>
                    <p className={`leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      {msg.message}
                    </p>
                  </div>
                ))}
                {filteredMuseMessages.length === 0 && (
                  <div className={`p-4 text-xs text-center rounded-xl border ${subSurface} ${mutedText}`}>
                    No Meta Muse reports match the current filter.
                  </div>
                )}
              </div>

              {/* Inline Two-Way Muse Dispatch Form */}
              <form onSubmit={handleSendToMuse} className={`rounded-xl border p-3 space-y-2 ${subSurface}`}>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={museAction}
                    onChange={(e) => setMuseAction(e.target.value as any)}
                    className={`min-h-[38px] px-2.5 py-1 rounded-lg border text-xs ${
                      isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="request_stats_sync">Request IG/FB Stats Sync</option>
                    <option value="send_directive">Send Placement Directive</option>
                    <option value="send_youtube_retention">Send YT Retention Read</option>
                  </select>
                  <input
                    type="text"
                    value={museCampaign}
                    onChange={(e) => setMuseCampaign(e.target.value)}
                    placeholder="Campaign (e.g. The Milestone)"
                    className={`min-h-[38px] px-2.5 py-1 rounded-lg border text-xs ${
                      isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                {museAction === 'send_youtube_retention' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <input
                      type="text"
                      value={musePostId}
                      onChange={(e) => setMusePostId(e.target.value)}
                      placeholder="Video/Post ID"
                      className={`min-h-[38px] px-2 py-1 rounded-lg border text-xs font-mono ${
                        isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                    <select
                      value={museWindow}
                      onChange={(e) => setMuseWindow(e.target.value as any)}
                      className={`min-h-[38px] px-2 py-1 rounded-lg border text-xs font-mono ${
                        isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    >
                      <option value="T+24h">T+24h</option>
                      <option value="T+72h">T+72h</option>
                      <option value="T+7d">T+7d</option>
                    </select>
                    <input
                      type="text"
                      value={museStayedPct}
                      onChange={(e) => setMuseStayedPct(e.target.value)}
                      placeholder="Stayed %"
                      className={`min-h-[38px] px-2 py-1 rounded-lg border text-xs font-mono ${
                        isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                    <input
                      type="text"
                      value={museApvPct}
                      onChange={(e) => setMuseApvPct(e.target.value)}
                      placeholder="APV %"
                      className={`min-h-[38px] px-2 py-1 rounded-lg border text-xs font-mono ${
                        isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                ) : (
                  <input
                    type="text"
                    value={museMessage}
                    onChange={(e) => setMuseMessage(e.target.value)}
                    placeholder="Message or directive to Edison (Meta Muse)..."
                    className={`w-full min-h-[38px] px-2.5 py-1 rounded-lg border text-xs ${
                      isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                )}

                <button
                  type="submit"
                  disabled={isSendingMuse}
                  className="w-full min-h-[40px] px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSendingMuse ? 'Sending to Muse...' : 'Dispatch to Edison (Meta Muse)'}</span>
                </button>
              </form>
            </section>
          </div>

          {/* BENTO ROW 2: READY SHORTS PUBLISHING QUEUE (Clickable Edit & Sync) */}
          <section className={`rounded-2xl border p-4 sm:p-5 space-y-4 ${cardSurface}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm sm:text-base font-bold">
                  Ready Shorts &amp; Scheduled Slots ({filteredShorts.length})
                </h3>
                <p className={`text-xs mt-0.5 ${mutedText}`}>
                  Click any live or scheduled Short to preview, edit metadata &amp; hooks, or sync across YouTube, TikTok, IG, Facebook, and DistroKid.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigateToTab('omnipost')}
                className={`min-h-[38px] px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer whitespace-nowrap shrink-0 ${subSurface}`}
              >
                Open OmniPost Captions
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
              {filteredShorts.map((short) => {
                const imgBroken = brokenImages[short.id];
                return (
                  <div
                    key={short.id}
                    onClick={() => handleOpenShortEditor(short)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleOpenShortEditor(short);
                      }
                    }}
                    className={`rounded-xl border overflow-hidden flex flex-col justify-between text-left cursor-pointer transition hover:border-indigo-500/60 group ${subSurface}`}
                  >
                    <div className="flex gap-3 p-3">
                      {/* 9:16 Vertical Thumbnail with resilient gradient fallback */}
                      <div className="w-16 h-28 rounded-lg overflow-hidden shrink-0 border border-slate-800 bg-gradient-to-br from-slate-800 via-indigo-950 to-slate-900 flex flex-col items-center justify-center relative">
                        {short.thumbnail_asset_url && !imgBroken ? (
                          <img
                            src={short.thumbnail_asset_url}
                            alt={short.title}
                            referrerPolicy="no-referrer"
                            onError={() => setBrokenImages((prev) => ({ ...prev, [short.id]: true }))}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="p-1.5 text-center space-y-1">
                            <Play className="w-4 h-4 text-indigo-300 mx-auto" />
                            <span className="block text-[9px] font-mono text-slate-300 leading-tight">
                              {short.duration || '9:16'}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className={`text-[11px] font-mono truncate ${mutedText}`}>
                          {short.campaign} · {short.status}
                        </div>
                        <h4 className="text-sm font-semibold leading-snug line-clamp-2 group-hover:text-indigo-400 transition-colors">
                          {short.title}
                        </h4>
                        {short.hook_text && (
                          <div className="text-xs font-mono text-amber-400 truncate">
                            Hook: &quot;{short.hook_text}&quot;
                          </div>
                        )}
                        {short.scheduled_slot && (
                          <div className={`text-[11px] font-mono truncate ${mutedText}`}>
                            {short.scheduled_slot}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="px-3 py-2 border-t border-slate-800/40 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3 text-[11px]">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenProjectCoordination(short.track || short.campaign);
                          }}
                          className={`hover:underline cursor-pointer ${mutedText}`}
                        >
                          Open Project
                        </button>
                        {short.youtube_url && (
                          <a
                            href={short.youtube_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-rose-400 hover:underline inline-flex items-center gap-1"
                          >
                            <span>YT</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenShortEditor(short);
                        }}
                        className="min-h-[34px] px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit &amp; Sync</span>
                      </button>
                    </div>
                  </div>
                );
              })}

              {filteredShorts.length === 0 && (
                <div className={`col-span-full rounded-xl border p-6 text-center text-xs ${subSurface} ${mutedText}`}>
                  No queued Shorts match the current filter. Sync MCP or dispatch a Playbook stage under Current Project.
                </div>
              )}
            </div>
          </section>

          {/* BENTO ROW 3: 6-OUTLET SOCIAL & SHORTS ALIGNMENT MATRIX */}
          <section className={`rounded-2xl border p-4 sm:p-5 space-y-4 ${cardSurface}`}>
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm sm:text-base font-bold">
                  6-Outlet Production &amp; Shorts Alignment Matrix
                </h3>
                <p className={`text-xs mt-0.5 ${mutedText}`}>
                  YouTube &amp; Shorts, TikTok, Instagram Reels (@brickredeemed + @theknotcreations), Facebook &amp; X, and Spotify/Apple (DistroKid).
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Filter Switcher with Real Live Counts */}
                <div
                  className={`flex items-center p-1 rounded-xl border ${
                    isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
                  }`}
                >
                  {[
                    { id: 'active' as const, label: `Active Campaigns (${activeCampaignCount})` },
                    { id: 'issues' as const, label: `Needs Action (${needsActionCount})` },
                    { id: 'all' as const, label: `All Catalog (${allMatrixRows.length})` }
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setMatrixFilter(f.id)}
                      className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer whitespace-nowrap shrink-0 ${
                        matrixFilter === f.id
                          ? 'bg-indigo-600 text-white'
                          : mutedText
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* Sort Selector: Manual, Date, Completion */}
                <select
                  value={matrixSortMode}
                  onChange={(e) => handleChangeSortMode(e.target.value as MatrixSortMode)}
                  aria-label="Sort matrix rows"
                  className={`min-h-[40px] px-3 py-1.5 rounded-xl border text-xs font-medium cursor-pointer ${
                    isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="manual">Sort: Manual Order (Drag / ↑↓)</option>
                  <option value="date_desc">Sort: Date (Newest / Soonest)</option>
                  <option value="date_asc">Sort: Date (Oldest First)</option>
                  <option value="completion_desc">Sort: Completion (Highest %)</option>
                  <option value="completion_asc">Sort: Completion (Lowest %)</option>
                </select>

                {/* Bulk Manage Active Campaigns & Needs Action Lists */}
                <button
                  type="button"
                  onClick={() => setIsListManagerOpen(true)}
                  className={`min-h-[40px] px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${subSurface}`}
                  title="Add, pin, archive, or flag tracks across Active Campaigns & Needs Action"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Manage Lists</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1060px]">
                <thead>
                  <tr className={`border-b text-[11px] font-mono ${isDarkMode ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
                    <th className="py-2.5 pr-2 font-medium w-20">Order</th>
                    <th className="py-2.5 pr-3 font-medium">Production · Date &amp; Completion</th>
                    {SOCIAL_OUTLET_DEFINITIONS.map((o) => (
                      <th key={o.key} className="py-2.5 px-2 font-medium">
                        <div>{o.label}</div>
                        <div className="text-[10px] opacity-70 font-normal">{o.source}</div>
                      </th>
                    ))}
                    <th className="py-2.5 pl-2 text-right font-medium">Lists &amp; Project</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-xs">
                  {alignmentRows.map((row, rowIndex) => (
                    <tr
                      key={row.track.id}
                      draggable
                      onDragStart={() => setDraggedTrackId(row.track.id)}
                      onDragOver={(e) => {
                        if (draggedTrackId && draggedTrackId !== row.track.id) {
                          e.preventDefault();
                        }
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (draggedTrackId) {
                          handleDropReorder(draggedTrackId, row.track.id);
                          setDraggedTrackId(null);
                        }
                      }}
                      onDragEnd={() => setDraggedTrackId(null)}
                      className={`transition ${
                        draggedTrackId === row.track.id
                          ? 'opacity-50'
                          : isDarkMode
                          ? 'hover:bg-slate-800/35'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      {/* Reorder Column: Drag Grip + Accessible Up/Down Buttons */}
                      <td className="py-2.5 pr-2 align-middle">
                        <div className="flex items-center gap-0.5">
                          <span
                            className={`p-1 cursor-grab active:cursor-grabbing ${mutedText}`}
                            title="Drag row to reorder manually"
                          >
                            <GripVertical className="w-3.5 h-3.5" />
                          </span>
                          <button
                            type="button"
                            disabled={rowIndex === 0}
                            onClick={() => handleMoveTrackRow(row.track.id, 'up')}
                            aria-label={`Move ${row.track.title} up`}
                            title="Move Up"
                            className={`p-1 rounded hover:bg-slate-800/60 disabled:opacity-25 cursor-pointer ${mutedText}`}
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={rowIndex === alignmentRows.length - 1}
                            onClick={() => handleMoveTrackRow(row.track.id, 'down')}
                            aria-label={`Move ${row.track.title} down`}
                            title="Move Down"
                            className={`p-1 rounded hover:bg-slate-800/60 disabled:opacity-25 cursor-pointer ${mutedText}`}
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Production / Date / Completion / Action Note */}
                      <td className="py-2.5 pr-3 max-w-[240px]">
                        <div className="font-semibold truncate">{row.track.title}</div>
                        <div className={`text-[11px] font-mono tabular-nums truncate ${mutedText}`}>
                          {row.track.id} · {row.completedCount}/{row.totalOutlets} ({row.completionPct}%) · {row.effectiveDateLabel}
                          {row.pref?.activeOverride === 'pinned' ? ' · Pinned' : ''}
                          {row.pref?.activeOverride === 'archived' ? ' · Archived' : ''}
                        </div>
                        {row.pref?.actionNote && (
                          <div className="text-[11px] text-rose-400 truncate mt-0.5">
                            Action: {row.pref.actionNote}
                          </div>
                        )}
                      </td>

                      {row.outlets.map(({ def, rec }) => {
                        const hasDirectLink = isSafeExternalUrl(rec.postUrl);
                        return (
                          <td key={def.key} className="py-2 px-1.5 align-middle">
                            <div className="flex items-center gap-1">
                              <select
                                value={rec.status}
                                onChange={(e) =>
                                  handleSaveOutletStatus({
                                    trackId: row.track.id,
                                    outletKey: def.key,
                                    status: e.target.value,
                                    scheduledSlot: rec.scheduledSlot,
                                    postUrl: rec.postUrl,
                                    postId: rec.postId,
                                    cohort: rec.cohort,
                                    playlistId: rec.playlistId
                                  })
                                }
                                aria-label={`${row.track.title} ${def.label} status`}
                                className={`flex-1 min-w-[105px] min-h-[38px] px-2 py-1 rounded-lg border text-[11px] font-medium cursor-pointer ${statusToneClass(rec.status)}`}
                              >
                                {OUTLET_STATUS_OPTIONS.map((opt) => (
                                  <option
                                    key={opt}
                                    value={opt}
                                    className={isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}
                                  >
                                    {opt}
                                  </option>
                                ))}
                              </select>

                              {hasDirectLink && (
                                <a
                                  href={rec.postUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title={`Open ${def.label}: ${rec.postUrl}${rec.postId ? ` (ID: ${rec.postId})` : ''}`}
                                  aria-label={`Open ${row.track.title} ${def.label} post or scheduled link`}
                                  className="min-h-[38px] min-w-[32px] px-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 inline-flex items-center justify-center shrink-0 transition"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}

                              <button
                                type="button"
                                onClick={() =>
                                  setEditingOutletLink({
                                    trackId: row.track.id,
                                    trackTitle: row.track.title,
                                    outletKey: def.key,
                                    outletLabel: def.label,
                                    status: rec.status,
                                    postUrl: rec.postUrl || '',
                                    postId: rec.postId || '',
                                    scheduledSlot: rec.scheduledSlot || '',
                                    cohort: rec.cohort || 'Cohort C',
                                    playlistId: rec.playlistId || CANONICAL_PLAYLISTS[0].id
                                  })
                                }
                                title={
                                  hasDirectLink
                                    ? `Edit ${def.label} link or item ID`
                                    : `Add direct link or scheduled ID for ${def.label}`
                                }
                                aria-label={`Edit ${row.track.title} ${def.label} direct link`}
                                className={`min-h-[38px] min-w-[30px] px-1.5 rounded-lg border inline-flex items-center justify-center shrink-0 cursor-pointer transition ${
                                  hasDirectLink
                                    ? isDarkMode
                                      ? 'border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                                      : 'border-slate-300 text-slate-600 hover:text-slate-900'
                                    : isDarkMode
                                    ? 'border-slate-800/80 text-slate-500 hover:text-cyan-300 hover:border-cyan-500/40'
                                    : 'border-slate-200 text-slate-400 hover:text-cyan-700'
                                }`}
                              >
                                <Link2 className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        );
                      })}

                      {/* Quick Row List Toggles + Open Project Button */}
                      <td className="py-2 pl-2 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateMatrixPreference({
                                trackId: row.track.id,
                                activeOverride: row.isActiveCampaign ? 'archived' : 'pinned'
                              })
                            }
                            title={
                              row.isActiveCampaign
                                ? 'Remove / Archive from Active Campaigns'
                                : 'Pin / Add to Active Campaigns'
                            }
                            aria-label={
                              row.isActiveCampaign
                                ? `Archive ${row.track.title} from Active Campaigns`
                                : `Pin ${row.track.title} to Active Campaigns`
                            }
                            className={`min-h-[36px] min-w-[36px] px-2 rounded-lg border flex items-center justify-center cursor-pointer transition ${
                              row.isActiveCampaign
                                ? `${subSurface} hover:text-amber-400`
                                : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                            }`}
                          >
                            {row.isActiveCampaign ? (
                              <Archive className="w-3.5 h-3.5" />
                            ) : (
                              <Pin className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateMatrixPreference({
                                trackId: row.track.id,
                                needsActionOverride: row.hasIssue ? 'cleared' : 'flagged'
                              })
                            }
                            title={
                              row.hasIssue
                                ? 'Clear from Needs Action list'
                                : 'Flag into Needs Action list'
                            }
                            aria-label={
                              row.hasIssue
                                ? `Clear Needs Action for ${row.track.title}`
                                : `Flag ${row.track.title} as Needs Action`
                            }
                            className={`min-h-[36px] min-w-[36px] px-2 rounded-lg border flex items-center justify-center cursor-pointer transition ${
                              row.hasIssue
                                ? 'border-rose-500/40 bg-rose-500/10 text-rose-400 hover:bg-emerald-500/10 hover:text-emerald-400'
                                : `${subSurface} hover:text-rose-400`
                            }`}
                          >
                            {row.hasIssue ? (
                              <Check className="w-3.5 h-3.5" />
                            ) : (
                              <Flag className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenProjectCoordination(row.track.title)}
                            title="Switch to Current Project coordination tools (8-Check Audit, Suno Hooks, Playbook Stages, Release Guard & Retention Rescue)"
                            className="min-h-[36px] px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0"
                          >
                            Open Project
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {alignmentRows.length === 0 && (
                    <tr>
                      <td colSpan={8} className={`py-8 text-center text-xs ${mutedText}`}>
                        No productions match this filter. Switch to All Catalog or click Manage Lists above to pin tracks.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* BENTO ROW 4: CANONICAL LINKS, PLAYLIST FUNNELS & EXTERNAL MCP SNAPSHOTS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Release Links & Canonical Public Playlists (7 cols) */}
            <section className={`lg:col-span-7 rounded-2xl border p-4 sm:p-5 space-y-4 ${cardSurface}`}>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <Music2 className="w-4 h-4 text-emerald-400" />
                  <span>Canonical Streaming Links & Co-Visitation Playlists</span>
                </h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { label: 'Spotify Album', url: ingest?.releaseLinks?.spotify_album },
                  { label: 'Spotify Track', url: ingest?.releaseLinks?.spotify_track },
                  { label: 'Apple Music', url: ingest?.releaseLinks?.apple_music },
                  { label: 'YouTube Music', url: ingest?.releaseLinks?.youtube_music }
                ].map((item) => (
                  <a
                    key={item.label}
                    href={item.url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`rounded-xl border p-3 text-xs font-semibold flex items-center justify-between gap-2 transition ${
                      item.url
                        ? `${subSurface} hover:border-emerald-500/60`
                        : `${subSurface} opacity-50 pointer-events-none`
                    }`}
                  >
                    <span className="truncate">{item.label}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  </a>
                ))}
              </div>

              <div className="space-y-2">
                <div className={`text-xs font-medium ${mutedText}`}>
                  4 Canonical Public Playlists (All Shorts & Long-Form Tunnel via &list=PLAYLIST_ID)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {CANONICAL_PLAYLISTS.map((pl) => (
                    <div
                      key={pl.id}
                      className={`rounded-xl border p-2.5 flex items-center justify-between gap-2 ${subSurface}`}
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-mono text-cyan-400">{pl.id}</div>
                        <div className={`text-[11px] truncate ${mutedText}`}>{pl.name}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onCopyText(`&list=${pl.id}`, `Playlist suffix ${pl.id}`)}
                        className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                        title={`Copy &list=${pl.id}`}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Multi-Server MCP Hub Status Summary + Pinned Widgets (5 cols) */}
            <section className={`lg:col-span-5 rounded-2xl border p-4 sm:p-5 flex flex-col justify-between gap-4 ${cardSurface}`}>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <Plug className="w-4 h-4 text-indigo-400" />
                    <span>Connected MCP Servers ({servers.length})</span>
                  </h3>
                  <p className={`text-xs mt-0.5 ${mutedText}`}>
                    Ingesting tools & telemetry across registered MCP endpoints.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSubView('mcp')}
                  className="min-h-[38px] px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0"
                >
                  Manage MCPs
                </button>
              </div>

              <div className="space-y-2">
                {servers.map((srv) => (
                  <div key={srv.id} className={`rounded-xl border p-3 flex items-center justify-between gap-2 ${subSurface}`}>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold truncate">{srv.name}</div>
                      <div className={`text-[11px] font-mono truncate ${mutedText}`}>
                        {srv.url} · {srv.tools?.length || 0} tools · {srv.lastLatencyMs || 0}ms
                      </div>
                    </div>
                    <span
                      className={`text-xs font-mono shrink-0 ${
                        srv.lastStatus === 'connected' ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {srv.lastStatus === 'connected' ? 'Online' : srv.lastStatus || 'Pending'}
                    </span>
                  </div>
                ))}
              </div>

              {ingest?.pinnedWidgets && ingest.pinnedWidgets.length > 0 && (
                <div className="space-y-2">
                  <div className={`text-xs font-semibold ${mutedText}`}>Pinned MCP Tool Outputs</div>
                  {ingest.pinnedWidgets.slice(0, 2).map((pin) => (
                    <div key={pin.id} className={`rounded-xl border p-2.5 text-xs ${subSurface}`}>
                      <div className="font-semibold flex items-center justify-between">
                        <span>{pin.title}</span>
                        <span className={`font-mono text-[10px] ${mutedText}`}>{pin.toolName}</span>
                      </div>
                      <pre className="mt-1 text-[10px] font-mono max-h-20 overflow-hidden text-slate-400 whitespace-pre-wrap">
                        {typeof pin.lastResult === 'string'
                          ? pin.lastResult.slice(0, 240)
                          : JSON.stringify(pin.lastResult)?.slice(0, 240)}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      )}
      {/* INTERACTIVE SHORT METADATA & MULTI-PLATFORM SYNC MODAL */}
      <ShortMetadataSyncModal
        isOpen={Boolean(editingShortTarget)}
        target={editingShortTarget}
        tracks={tracks}
        servers={servers}
        outletStatuses={ingest?.outletStatuses || []}
        releaseLinks={ingest?.releaseLinks}
        isDarkMode={isDarkMode}
        onClose={() => setEditingShortTarget(null)}
        onSynced={({ shortOverrides, outletStatuses }) => {
          setIngest((prev) =>
            prev ? { ...prev, outletStatuses, shortOverrides } : prev
          );
          fetch('/api/mcp/dashboard-ingest?cacheOnly=1')
            .then((r) => (r.ok ? r.json() : null))
            .then((cached) => {
              if (cached?.success) setIngest(cached);
            })
            .catch(() => {});
          fetchDashboardIngest(true);
        }}
        onOpenProject={(titleOrSlug) => handleOpenProjectCoordination(titleOrSlug)}
        onNotify={onNotify}
      />

      {/* ALIGNMENT MATRIX CAMPAIGN LIST MANAGER MODAL */}
      <CampaignListManagerModal
        isOpen={isListManagerOpen}
        rows={listManagerSummaries}
        isDarkMode={isDarkMode}
        onClose={() => setIsListManagerOpen(false)}
        onSaved={(matrixPreferences) => {
          setIngest((prev) => (prev ? { ...prev, matrixPreferences } : prev));
        }}
        onNotify={onNotify}
      />

      {/* QUICK OUTLET DIRECT LINK / SCHEDULED ITEM EDITOR */}
      {editingOutletLink && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="outlet-link-editor-title"
        >
          <div className={`w-full max-w-md rounded-2xl border p-5 shadow-2xl space-y-4 ${cardSurface}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className={`text-xs font-mono truncate ${mutedText}`}>
                  {editingOutletLink.trackId} · {editingOutletLink.trackTitle}
                </div>
                <h3 id="outlet-link-editor-title" className="text-base font-bold mt-0.5">
                  {editingOutletLink.outletLabel} Direct Link
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingOutletLink(null)}
                aria-label="Close direct link editor"
                className={`min-w-[36px] min-h-[36px] rounded-lg flex items-center justify-center cursor-pointer ${
                  isDarkMode ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-600'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await handleSaveOutletStatus({
                  trackId: editingOutletLink.trackId,
                  outletKey: editingOutletLink.outletKey,
                  status: editingOutletLink.status,
                  scheduledSlot: editingOutletLink.scheduledSlot,
                  postUrl: editingOutletLink.postUrl.trim(),
                  postId: editingOutletLink.postId.trim(),
                  cohort: editingOutletLink.cohort,
                  playlistId: editingOutletLink.playlistId
                });
                setEditingOutletLink(null);
              }}
              className="space-y-3"
            >
              <div>
                <label className={`block text-xs font-semibold mb-1 ${mutedText}`}>
                  Direct Post, Video, or Scheduled Item URL
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={editingOutletLink.postUrl}
                    onChange={(e) =>
                      setEditingOutletLink((prev) => (prev ? { ...prev, postUrl: e.target.value } : prev))
                    }
                    placeholder="https://..."
                    className={`flex-1 min-h-[40px] px-3 py-1.5 rounded-xl border text-xs font-mono ${subSurface}`}
                  />
                  {isSafeExternalUrl(editingOutletLink.postUrl) && (
                    <a
                      href={editingOutletLink.postUrl.trim()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-h-[40px] px-3 py-1.5 rounded-xl border border-cyan-500/40 bg-cyan-500/10 text-cyan-300 text-xs font-semibold inline-flex items-center gap-1 shrink-0"
                    >
                      <span>Open</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${mutedText}`}>
                    Post / Scheduled Item ID
                  </label>
                  <input
                    type="text"
                    value={editingOutletLink.postId}
                    onChange={(e) =>
                      setEditingOutletLink((prev) => (prev ? { ...prev, postId: e.target.value } : prev))
                    }
                    placeholder="e.g. IG/FB/TikTok/YT ID"
                    className={`w-full min-h-[38px] px-3 py-1 rounded-xl border text-xs font-mono tabular-nums ${subSurface}`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${mutedText}`}>
                    Status
                  </label>
                  <select
                    value={editingOutletLink.status}
                    onChange={(e) =>
                      setEditingOutletLink((prev) => (prev ? { ...prev, status: e.target.value } : prev))
                    }
                    className={`w-full min-h-[38px] px-2.5 py-1 rounded-xl border text-xs cursor-pointer ${subSurface}`}
                  >
                    {OUTLET_STATUS_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingOutletLink(null)}
                  className={`min-h-[38px] px-4 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer ${subSurface}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-[38px] px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer"
                >
                  Save Outlet Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

