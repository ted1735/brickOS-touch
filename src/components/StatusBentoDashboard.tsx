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
  ArrowRight,
  Plug,
  Copy,
  FileText,
  Headphones,
  Layers,
  HardDrive,
  Sliders
} from 'lucide-react';
import { Track, CompositionSession } from '../types';
import {
  DashboardIngestPayload,
  SOCIAL_OUTLET_DEFINITIONS,
  OUTLET_STATUS_OPTIONS,
  CANONICAL_PLAYLISTS,
  getTelemetryWindowTag,
  toTrackSlug
} from '../types/mcpStatus';
import { CurrentProjectCoordinationPanel } from './CurrentProjectCoordinationPanel';
import { McpHubIngestionPanel } from './McpHubIngestionPanel';
import { StudioWorkspace, getSuggestedTrackStep } from './StudioHome';

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

export const StatusBentoDashboard: React.FC<StatusBentoDashboardProps> = ({
  tracks,
  selectedTrack,
  onSelectTrack,
  onContinueTrack,
  onOpenWorkspace,
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

  const fetchDashboardIngest = async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const res = await fetch('/api/mcp/dashboard-ingest');
      const data: DashboardIngestPayload = await res.json();
      if (data && data.success) {
        setIngest(data);
      }
    } catch (err: any) {
      if (!silent) onNotify(err?.message || 'MCP dashboard refresh failed', 'error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
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
      if (data.success && data.record) {
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
      }
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
          activeTrackTitle: selectedTrack.title,
          snapshot: {
            youtube: ingest.youtube,
            readyShorts: ingest.readyShorts,
            metaMuseMessages: ingest.metaMuse?.messages?.slice(0, 6),
            googleSheet: ingest.googleSheet
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        setDailyBrief(data.brief);
        onNotify('Generated Gemini live status brief from MCP telemetry.', 'success');
      } else {
        onNotify(data.error || 'Could not synthesize brief', 'error');
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
        campaign: museCampaign.trim() || selectedTrack.title
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
      if (data.success) {
        setMuseMessage('');
        onNotify('Dispatched update to Edison (Meta Muse) via MCP.', 'success');
        await fetchDashboardIngest(true);
      } else {
        onNotify(data.error || 'Muse bridge call failed', 'error');
      }
    } catch (err: any) {
      onNotify(err?.message || 'Failed contacting Muse', 'error');
    } finally {
      setIsSendingMuse(false);
    }
  };

  const handleOpenProjectCoordination = (trackTitleOrSlug: string) => {
    const q = trackTitleOrSlug.toLowerCase();
    const matched =
      tracks.find(
        (t) =>
          t.title.toLowerCase() === q ||
          toTrackSlug(t.title) === toTrackSlug(q) ||
          t.title.toLowerCase().includes(q) ||
          q.includes(t.title.toLowerCase())
      ) || selectedTrack;
    onSelectTrack(matched);
    setSubView('project');
  };

  // Merge catalog tracks + MCP tracks + Ready Shorts into the 6-Outlet Matrix
  const alignmentRows = useMemo(() => {
    const readyShorts = ingest?.readyShorts || [];
    const mcpTracks = ingest?.mcpTracks || [];
    const ytVideos = ingest?.youtube?.videos || [];
    const outletStatuses = ingest?.outletStatuses || [];
    const museMsgs = ingest?.metaMuse?.messages || [];

    return tracks
      .map((t) => {
        const slug = toTrackSlug(t.title);
        const mcpMatch = mcpTracks.find(
          (m) => m.slug === slug || m.title.toLowerCase() === t.title.toLowerCase()
        );
        const shortMatch = readyShorts.find(
          (s) =>
            s.track.toLowerCase() === t.title.toLowerCase() ||
            s.campaign.toLowerCase() === t.title.toLowerCase()
        );
        const ytMatch = ytVideos.find((v) =>
          v.title.toLowerCase().includes(t.title.toLowerCase())
        );
        const museMatch = museMsgs.find(
          (m) =>
            (m.campaign || '').toLowerCase().includes(t.title.toLowerCase()) ||
            m.message.toLowerCase().includes(t.title.toLowerCase())
        );

        const getOutlet = (outletKey: string) => {
          const saved = outletStatuses.find(
            (o) => o.trackId === t.id && o.outletKey === outletKey
          );
          if (saved) return saved;

          let derivedStatus = 'Not Started';
          if (outletKey === 'youtube_shorts') {
            if (ytMatch) derivedStatus = 'Published';
            else if (shortMatch) derivedStatus = 'Scheduled';
            else if (mcpMatch?.status === 'Published') derivedStatus = 'Published';
          } else if (outletKey === 'instagram_reels' || outletKey === 'facebook_x') {
            if (museMatch?.message.toLowerCase().includes('cancel')) derivedStatus = 'Needs Correction';
            else if (museMatch?.message.toLowerCase().includes('published')) derivedStatus = 'Published';
            else if (museMatch?.message.toLowerCase().includes('scheduled') || shortMatch) derivedStatus = 'Scheduled';
          } else if (outletKey === 'distro_streaming') {
            if (shortMatch?.spotify_url || mcpMatch?.status === 'Published' || t.status === 'Released') {
              derivedStatus = 'Published';
            }
          }
          return {
            trackId: t.id,
            outletKey,
            status: derivedStatus,
            scheduledSlot: shortMatch?.scheduled_slot || '',
            postUrl: outletKey === 'youtube_shorts' ? ytMatch?.url || shortMatch?.youtube_url || '' : '',
            postId: outletKey === 'youtube_shorts' ? ytMatch?.video_id || shortMatch?.youtube_id || '' : '',
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

        const hasIssue = outlets.some((o) => o.rec.status === 'Needs Correction' || o.rec.status === 'Vetoed / Pulled');
        const isActiveCampaign =
          Boolean(shortMatch) ||
          Boolean(ytMatch) ||
          Boolean(museMatch) ||
          t.id === selectedTrack.id ||
          mcpMatch?.status === 'Published' ||
          mcpMatch?.status === 'In Progress' ||
          outlets.some((o) => o.rec.status !== 'Not Started');

        return {
          track: t,
          slug: mcpMatch?.slug || slug,
          mcpStatus: mcpMatch?.status || t.status,
          shortMatch,
          ytMatch,
          museMatch,
          outlets,
          hasIssue,
          isActiveCampaign
        };
      })
      .filter((row) => {
        if (matrixFilter === 'active' && !row.isActiveCampaign) return false;
        if (matrixFilter === 'issues' && !row.hasIssue) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return (
            row.track.title.toLowerCase().includes(q) ||
            row.track.id.toLowerCase().includes(q) ||
            row.track.ep.toLowerCase().includes(q) ||
            row.slug.includes(q)
          );
        }
        return true;
      });
  }, [tracks, ingest, selectedTrack.id, matrixFilter, searchQuery]);

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
  const museMessages = ingest?.metaMuse?.messages || [];
  const readyShorts = ingest?.readyShorts || [];
  const servers = ingest?.servers || [];
  const connectedServerCount = servers.filter((s) => s.lastStatus === 'connected').length;

  const filteredShorts = readyShorts.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.title.toLowerCase().includes(q) ||
      s.campaign.toLowerCase().includes(q) ||
      s.track.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q)
    );
  });

  const filteredMuseMessages = museMessages.filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (m.campaign || '').toLowerCase().includes(q) ||
      m.message.toLowerCase().includes(q) ||
      m.agent.toLowerCase().includes(q)
    );
  });

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-5 pb-6">
      {/* TOP COMMAND HEADER: VIEW SWITCHER + SEARCH + LIVE MCP SYNC */}
      <section className={`rounded-2xl border p-4 sm:p-5 ${cardSurface}`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="min-w-0">
            <div className={`text-xs font-mono ${mutedText}`}>
              brick · @brickRedeemed · {connectedServerCount}/{servers.length || 1} MCP Servers Active
              {ingest?.fetchedAt ? ` · Synced ${new Date(ingest.fetchedAt).toLocaleTimeString()}` : ''}
              {ingest?.fromCache ? ' · Cached' : ''}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight mt-0.5">
              brickOS Production, Shorts & Social Status
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

            <button
              type="button"
              onClick={() => fetchDashboardIngest(false)}
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

        {/* Filter Bar + Active Studio Continuity Strip */}
        <div className="mt-4 pt-3.5 border-t border-slate-800/40 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${mutedText}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter campaigns, tracks, Shorts, Muse updates, or IDs..."
              className={`w-full min-h-[44px] pl-9 pr-3 py-2 rounded-xl border text-xs ${
                isDarkMode
                  ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500'
                  : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
              }`}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-xs ${mutedText}`}>
              Active Track: <strong className={isDarkMode ? 'text-white' : 'text-slate-900'}>{selectedTrack.id} · {selectedTrack.title}</strong>
            </span>
            <button
              type="button"
              onClick={onContinueTrack}
              className="min-h-[40px] px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <span>{nextStep.label}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onOpenWorkspace('write', 'lyrics')}
              className={`min-h-[40px] px-2.5 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1 cursor-pointer ${subSurface}`}
            >
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <span>Write</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenWorkspace('produce', 'mixer')}
              className={`min-h-[40px] px-2.5 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1 cursor-pointer ${subSurface}`}
            >
              <Headphones className="w-3.5 h-3.5 text-emerald-400" />
              <span>Produce</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateToTab('nextcloud_sync')}
              className={`min-h-[40px] px-2.5 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1 cursor-pointer ${subSurface}`}
            >
              <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
              <span>Files</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateToTab('kanban')}
              className={`min-h-[40px] px-2.5 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1 cursor-pointer ${subSurface}`}
            >
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>Pipeline</span>
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
          progressMarkdown={ingest?.progressMarkdown || ''}
          isDarkMode={isDarkMode}
          onRefreshDashboard={() => fetchDashboardIngest(false)}
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
                        {yt.channel.subscribers.toLocaleString()}
                      </div>
                    </div>
                    <div className={`rounded-xl border p-3 ${subSurface}`}>
                      <div className={`text-[11px] ${mutedText}`}>Total Views · {yt.channel.video_count} Videos</div>
                      <div className="text-xl font-bold font-mono tabular-nums mt-0.5">
                        {yt.channel.total_views.toLocaleString()}
                      </div>
                    </div>
                    <div className={`rounded-xl border p-3 ${subSurface}`}>
                      <div className={`text-[11px] ${mutedText}`}>10-Post Median</div>
                      <div className="text-xl font-bold font-mono tabular-nums text-cyan-400 mt-0.5">
                        {yt.summary.rolling_median_views.toLocaleString()}
                      </div>
                    </div>
                    <div className={`rounded-xl border p-3 ${subSurface}`}>
                      <div className={`text-[11px] ${mutedText}`}>Avg Like / View</div>
                      <div className="text-xl font-bold font-mono tabular-nums text-emerald-400 mt-0.5">
                        {yt.summary.avg_like_to_view_pct}%
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
                          const isBreakoutEcho = v.views >= 400;
                          return (
                            <tr
                              key={v.video_id}
                              onClick={() => handleOpenProjectCoordination(v.title)}
                              className={`cursor-pointer transition ${
                                isDarkMode ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'
                              }`}
                            >
                              <td className="py-2.5 pr-3 max-w-[260px]">
                                <div className="font-medium truncate">{v.title}</div>
                                <div className={`text-[11px] font-mono ${mutedText}`}>
                                  {v.video_id} · {v.duration_iso || 'Short'}
                                  {isBreakoutEcho ? ' · Breakout (>400 views)' : ''}
                                </div>
                              </td>
                              <td className="py-2.5 px-2 text-right font-mono tabular-nums font-semibold">
                                {v.views.toLocaleString()}
                              </td>
                              <td className="py-2.5 px-2 text-right font-mono tabular-nums">
                                {v.likes.toLocaleString()}
                              </td>
                              <td className="py-2.5 px-2 text-right font-mono tabular-nums text-emerald-400">
                                {v.like_to_view_pct}%
                              </td>
                              <td className="py-2.5 pl-2 text-right font-mono text-[11px] whitespace-nowrap">
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

          {/* BENTO ROW 2: READY SHORTS PUBLISHING QUEUE */}
          <section className={`rounded-2xl border p-4 sm:p-5 space-y-4 ${cardSurface}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm sm:text-base font-bold">
                  Ready Shorts & Scheduled Slots ({filteredShorts.length})
                </h3>
                <p className={`text-xs mt-0.5 ${mutedText}`}>
                  Approved 1080×1920 vertical cuts staged from brickos-remote-mcp with opening vocal strike hooks & streaming links.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigateToTab('omnipost')}
                className={`min-h-[38px] px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer ${subSurface}`}
              >
                Open OmniPost Captions
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredShorts.map((short) => {
                const imgBroken = brokenImages[short.id];
                return (
                  <div key={short.id} className={`rounded-xl border overflow-hidden flex flex-col justify-between ${subSurface}`}>
                    <div className="flex gap-3 p-3.5">
                      {/* 9:16 Vertical Thumbnail with resilient gradient fallback */}
                      <div className="w-20 h-36 rounded-lg overflow-hidden shrink-0 border border-slate-800 bg-gradient-to-br from-slate-800 via-indigo-950 to-slate-900 flex flex-col items-center justify-center relative">
                        {short.thumbnail_asset_url && !imgBroken ? (
                          <img
                            src={short.thumbnail_asset_url}
                            alt={short.title}
                            referrerPolicy="no-referrer"
                            onError={() => setBrokenImages((prev) => ({ ...prev, [short.id]: true }))}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="p-2 text-center space-y-1">
                            <Play className="w-5 h-5 text-indigo-300 mx-auto" />
                            <span className="block text-[9px] font-mono text-slate-300 leading-tight">
                              {short.duration || '9:16'}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className={`text-[11px] font-mono truncate ${mutedText}`}>
                          {short.campaign} · {short.status}
                        </div>
                        <h4 className="text-sm font-semibold leading-snug line-clamp-2">{short.title}</h4>
                        {short.hook_text && (
                          <div className="text-xs font-mono text-amber-400">
                            Hook: &quot;{short.hook_text}&quot;
                          </div>
                        )}
                        {short.scheduled_slot && (
                          <div className={`text-xs font-mono ${mutedText}`}>
                            Slot: {short.scheduled_slot}
                          </div>
                        )}
                        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                          {short.video_asset_url && (
                            <a
                              href={short.video_asset_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-cyan-400 hover:underline inline-flex items-center gap-1"
                            >
                              <span>Master MP4</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                          {short.youtube_url && (
                            <a
                              href={short.youtube_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-rose-400 hover:underline inline-flex items-center gap-1"
                            >
                              <span>YouTube</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="px-3.5 py-2.5 border-t border-slate-800/40 flex items-center justify-between gap-2">
                      <span className={`text-[11px] font-mono truncate ${mutedText}`}>
                        {short.format || '1080x1920 9:16'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleOpenProjectCoordination(short.track || short.campaign)}
                        className="min-h-[36px] px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0"
                      >
                        Coordinate Project
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm sm:text-base font-bold">
                  6-Outlet Production & Shorts Alignment Matrix
                </h3>
                <p className={`text-xs mt-0.5 ${mutedText}`}>
                  Coordinate YouTube & Shorts, TikTok, Instagram Reels (@brickredeemed + @theknotcreations), Facebook & X, and Spotify/Apple DistroKit.
                </p>
              </div>
              <div
                className={`flex items-center p-1 rounded-xl border self-start ${
                  isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
                }`}
              >
                {[
                  { id: 'active' as const, label: 'Active Campaigns' },
                  { id: 'issues' as const, label: 'Needs Action' },
                  { id: 'all' as const, label: `All Catalog (${tracks.length})` }
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
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[920px]">
                <thead>
                  <tr className={`border-b text-[11px] font-mono ${isDarkMode ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
                    <th className="py-2.5 pr-3 font-medium">Production / Track</th>
                    {SOCIAL_OUTLET_DEFINITIONS.map((o) => (
                      <th key={o.key} className="py-2.5 px-2 font-medium">
                        <div>{o.label}</div>
                        <div className="text-[10px] opacity-70 font-normal">{o.source}</div>
                      </th>
                    ))}
                    <th className="py-2.5 pl-2 text-right font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-xs">
                  {alignmentRows.map((row) => (
                    <tr
                      key={row.track.id}
                      className={isDarkMode ? 'hover:bg-slate-800/35' : 'hover:bg-slate-50'}
                    >
                      <td className="py-3 pr-3 max-w-[220px]">
                        <div className="font-semibold truncate">{row.track.title}</div>
                        <div className={`text-[11px] font-mono truncate ${mutedText}`}>
                          {row.track.id} · {row.mcpStatus}
                        </div>
                      </td>
                      {row.outlets.map(({ def, rec }) => (
                        <td key={def.key} className="py-2.5 px-2">
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
                            className={`w-full min-h-[38px] px-2 py-1 rounded-lg border text-[11px] font-medium cursor-pointer ${statusToneClass(rec.status)}`}
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
                        </td>
                      ))}
                      <td className="py-2.5 pl-2 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenProjectCoordination(row.track.title)}
                          className={`min-h-[38px] px-3 py-1 rounded-lg border text-xs font-semibold cursor-pointer whitespace-nowrap ${subSurface}`}
                        >
                          Coordinate
                        </button>
                      </td>
                    </tr>
                  ))}
                  {alignmentRows.length === 0 && (
                    <tr>
                      <td colSpan={7} className={`py-8 text-center text-xs ${mutedText}`}>
                        No productions match this filter. Switch to All Catalog above to see every song.
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
    </div>
  );
};
