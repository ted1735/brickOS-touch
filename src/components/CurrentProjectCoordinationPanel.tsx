import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  ShieldCheck,
  Scissors,
  Clapperboard,
  Activity,
  Send,
  Play,
  FolderOpen,
  Ban
} from 'lucide-react';
import { Track } from '../types';
import {
  McpServerPublic,
  McpTrackSummary,
  ReadyShortItem,
  MuseMessageItem,
  SocialOutletStatus,
  SOCIAL_OUTLET_DEFINITIONS,
  OUTLET_STATUS_OPTIONS,
  CANONICAL_PLAYLISTS,
  COHORT_RULES,
  matchMcpSlug,
  checkDaypartViolation
} from '../types/mcpStatus';

interface CurrentProjectCoordinationPanelProps {
  tracks: Track[];
  selectedTrack: Track;
  onSelectTrack: (track: Track) => void;
  servers?: McpServerPublic[];
  mcpTracks: McpTrackSummary[];
  readyShorts: ReadyShortItem[];
  museMessages: MuseMessageItem[];
  outletStatuses: SocialOutletStatus[];
  isDarkMode: boolean;
  onSaveOutletStatus: (payload: {
    trackId: string;
    outletKey: string;
    status: string;
    scheduledSlot?: string;
    postUrl?: string;
    postId?: string;
    cohort?: string;
    playlistId?: string;
    notes?: string;
  }) => Promise<void>;
  onNavigateToTab: (tab: string) => void;
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const CurrentProjectCoordinationPanel: React.FC<CurrentProjectCoordinationPanelProps> = ({
  tracks,
  selectedTrack,
  onSelectTrack,
  servers = [],
  mcpTracks,
  readyShorts,
  museMessages,
  outletStatuses,
  isDarkMode,
  onSaveOutletStatus,
  onNavigateToTab,
  onNotify
}) => {
  const selectedTitleLc = String(selectedTrack?.title ?? '').toLowerCase();
  const matchedSlug = matchMcpSlug(selectedTrack?.title || '', mcpTracks);
  const [trackSlugInput, setTrackSlugInput] = useState<string>(matchedSlug);
  const [activeServerId, setActiveServerId] = useState<string>(
    servers[0]?.id || 'brickos-primary-mcp'
  );
  const [coordData, setCoordData] = useState<{
    trackRecord?: any;
    previewAssets?: any;
    auditReport?: any;
    latencyMs?: number;
  } | null>(null);
  const [coordError, setCoordError] = useState<string | null>(null);
  const [isLoadingCoord, setIsLoadingCoord] = useState(false);

  // Action states for EGM MCP tools
  const [isRunningAudit, setIsRunningAudit] = useState(false);
  const [isIngestingSuno, setIsIngestingSuno] = useState(false);
  const [sunoHooksResult, setSunoHooksResult] = useState<any>(null);

  const [playbookStage, setPlaybookStage] = useState<'seeds_only' | 'select_seeds' | 'flow_videos' | 'full_pipeline'>('seeds_only');
  const [isRunningPlaybook, setIsRunningPlaybook] = useState(false);
  const [playbookResult, setPlaybookResult] = useState<any>(null);
  const [jobIdInput, setJobIdInput] = useState('');
  const [isWaitingJob, setIsWaitingJob] = useState(false);
  const [jobWaitResult, setJobWaitResult] = useState<any>(null);

  // Rescue / Retention Check inputs
  const [rescuePostId, setRescuePostId] = useState('');
  const [rescuePlatform, setRescuePlatform] = useState('YouTube');
  const [rescueAccount, setRescueAccount] = useState('@brickRedeemed');
  const [rescueHours, setRescueHours] = useState('72');
  const [rescueStayedPct, setRescueStayedPct] = useState('');
  const [rescueApvPct, setRescueApvPct] = useState('');
  const [rescueViews, setRescueViews] = useState('');
  const [rescueVeto, setRescueVeto] = useState(false);
  const [isCheckingRescue, setIsCheckingRescue] = useState(false);
  const [rescueResult, setRescueResult] = useState<any>(null);

  // Approve Release Duplicate Guard inputs
  const [shortCutName, setShortCutName] = useState('Short_01');
  const [canonicalMasterFile, setCanonicalMasterFile] = useState('');
  const [approveSlot, setApproveSlot] = useState('');
  const [isApprovingRelease, setIsApprovingRelease] = useState(false);
  const [approveResult, setApproveResult] = useState<any>(null);

  // Selected Cohort & Playlist persisted with track's YouTube outlet record
  const trackOutletRecords = outletStatuses.filter((o) => o?.trackId === selectedTrack?.id);
  const primaryOutletRecord = trackOutletRecords.find((o) => o?.outletKey === 'youtube_shorts');
  const [cohort, setCohort] = useState<string>(primaryOutletRecord?.cohort || 'Cohort C');
  const [playlistId, setPlaylistId] = useState<string>(
    primaryOutletRecord?.playlistId || CANONICAL_PLAYLISTS[0].id
  );

  useEffect(() => {
    const nextSlug = matchMcpSlug(selectedTrack?.title || '', mcpTracks);
    setTrackSlugInput(nextSlug);
    setCoordData(null);
    setSunoHooksResult(null);
    setPlaybookResult(null);
    setRescueResult(null);
    setApproveResult(null);
    const ytRec = outletStatuses.find(
      (o) => o?.trackId === selectedTrack?.id && o?.outletKey === 'youtube_shorts'
    );
    if (ytRec?.cohort) setCohort(ytRec.cohort);
    if (ytRec?.playlistId) setPlaylistId(ytRec.playlistId);
    loadProjectCoordination(nextSlug);
  }, [selectedTrack?.id, mcpTracks.length]);

  const loadProjectCoordination = async (slugToLoad: string, serverOverride?: string) => {
    if (!slugToLoad) return;
    setIsLoadingCoord(true);
    setCoordError(null);
    const targetServer = serverOverride || activeServerId || 'brickos-primary-mcp';
    try {
      const res = await fetch('/api/mcp/project-coordination', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackSlug: slugToLoad, serverId: targetServer })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        const errMsg = data?.error || `Failed to sync project coordination (HTTP ${res.status})`;
        setCoordError(errMsg);
        onNotify(errMsg, 'error');
        return;
      }
      setCoordData(data);
      const relatedShort = (Array.isArray(readyShorts) ? readyShorts : []).find(
        (s) => {
          const sTrackLc = String(s?.track ?? '').toLowerCase();
          return (
            Boolean(selectedTitleLc && sTrackLc.includes(selectedTitleLc)) ||
            Boolean(sTrackLc && selectedTitleLc.includes(sTrackLc))
          );
        }
      );
      if (relatedShort) {
        if (relatedShort.youtube_id && relatedShort.youtube_id !== 'PENDING_PUBLISH') {
          setRescuePostId(relatedShort.youtube_id);
        }
        if (relatedShort.scheduled_slot) setApproveSlot(relatedShort.scheduled_slot);
      }
    } catch (err: any) {
      const errMsg = err?.message || 'Network error fetching project coordination state';
      setCoordError(errMsg);
      onNotify(errMsg, 'error');
    } finally {
      setIsLoadingCoord(false);
    }
  };

  const callMcpTool = async (toolName: string, args: Record<string, any>) => {
    const res = await fetch('/api/mcp/call', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serverId: activeServerId || 'brickos-primary-mcp',
        toolName,
        arguments: args
      })
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data?.error || `MCP tool error (HTTP ${res.status})` };
    }
    return data;
  };

  const handleRunAudit = async () => {
    setIsRunningAudit(true);
    try {
      const data = await callMcpTool('brickos_audit_playbook', { track_slug: trackSlugInput });
      if (data.success) {
        setCoordData((prev) => ({ ...(prev || {}), auditReport: data.data }));
        onNotify('8-Check Pre-Publish Audit finished.', 'success');
      } else {
        onNotify(data.error || 'Audit failed', 'error');
      }
    } catch (err: any) {
      onNotify(err?.message || 'Audit request failed', 'error');
    } finally {
      setIsRunningAudit(false);
    }
  };

  const handleIngestSuno = async () => {
    setIsIngestingSuno(true);
    try {
      const data = await callMcpTool('brickos_ingest_suno', {
        track_slug: trackSlugInput,
        clip_duration_sec: 20
      });
      setSunoHooksResult(data.success ? data.data : { error: data.error });
      onNotify(
        data.success ? 'Suno audio strike check completed.' : data.error || 'Ingest failed',
        data.success ? 'success' : 'error'
      );
    } catch (err: any) {
      setSunoHooksResult({ error: err?.message || 'Suno ingest failed' });
      onNotify(err?.message || 'Suno audio ingest failed', 'error');
    } finally {
      setIsIngestingSuno(false);
    }
  };

  const handleRunPlaybook = async () => {
    setIsRunningPlaybook(true);
    try {
      const data = await callMcpTool('brickos_run_playbook', {
        track_slug: trackSlugInput,
        stage: playbookStage,
        idempotency_key: `${trackSlugInput}-${playbookStage}-${Date.now()}`
      });
      setPlaybookResult(data.success ? data.data : { error: data.error });
      if (data.data?.job_id) setJobIdInput(String(data.data.job_id));
      onNotify(
        data.success ? `Playbook stage '${playbookStage}' dispatched.` : data.error || 'Playbook dispatch failed',
        data.success ? 'success' : 'error'
      );
    } catch (err: any) {
      setPlaybookResult({ error: err?.message || 'Playbook dispatch error' });
      onNotify(err?.message || 'Playbook dispatch failed', 'error');
    } finally {
      setIsRunningPlaybook(false);
    }
  };

  const handleJobWait = async () => {
    if (!jobIdInput.trim()) {
      onNotify('Enter a job_id to poll.', 'error');
      return;
    }
    setIsWaitingJob(true);
    try {
      const data = await callMcpTool('brickos_job_wait', {
        job_id: jobIdInput.trim(),
        wait_seconds: 5
      });
      setJobWaitResult(data.success ? data.data : { error: data.error });
      if (!data.success) {
        onNotify(data.error || 'Job poll failed', 'error');
      }
    } catch (err: any) {
      setJobWaitResult({ error: err?.message || 'Job poll error' });
      onNotify(err?.message || 'Job wait failed', 'error');
    } finally {
      setIsWaitingJob(false);
    }
  };

  const handleCheckRescue = async () => {
    if (!rescuePostId.trim()) {
      onNotify('Enter a YouTube or Meta post_id to evaluate.', 'error');
      return;
    }
    setIsCheckingRescue(true);
    try {
      const args: Record<string, any> = {
        post_id: rescuePostId.trim(),
        platform: rescuePlatform,
        account_handle: rescueAccount,
        hours_since_publish: Number(rescueHours) || 0,
        quality_veto: rescueVeto
      };
      if (rescueStayedPct !== '') args.stayed_to_watch_pct = Number(rescueStayedPct);
      if (rescueApvPct !== '') args.apv_pct = Number(rescueApvPct);
      if (rescueViews !== '') args.views = Number(rescueViews);

      const data = await callMcpTool('brickos_telemetry_rescue_check', args);
      setRescueResult(data.success ? data.data : { error: data.error });
      onNotify(
        data.success ? 'Retention rescue check evaluated.' : data.error || 'Rescue check failed',
        data.success ? 'success' : 'error'
      );
    } catch (err: any) {
      setRescueResult({ error: err?.message || 'Rescue check error' });
      onNotify(err?.message || 'Retention rescue check failed', 'error');
    } finally {
      setIsCheckingRescue(false);
    }
  };

  const handleApproveRelease = async () => {
    if (!canonicalMasterFile.trim()) {
      onNotify('Specify canonical_master_file (e.g. *_Master_v5.mp4).', 'error');
      return;
    }
    setIsApprovingRelease(true);
    try {
      const data = await callMcpTool('brickos_approve_release', {
        track_slug: trackSlugInput,
        short_cut: shortCutName.trim() || 'Short_01',
        canonical_master_file: canonicalMasterFile.trim(),
        scheduled_slot: approveSlot.trim() || undefined,
        platforms: ['YouTube @brickRedeemed', 'Facebook Page', 'IG @brickredeemed', 'IG @theknotcreations']
      });
      setApproveResult(data.success ? data.data : { error: data.error });
      onNotify(
        data.success ? 'Duplicate Guard & Release Approval updated.' : data.error || 'Approval check failed',
        data.success ? 'success' : 'error'
      );
    } catch (err: any) {
      setApproveResult({ error: err?.message || 'Release approval error' });
      onNotify(err?.message || 'Release approval check failed', 'error');
    } finally {
      setIsApprovingRelease(false);
    }
  };

  const matchingShorts = (Array.isArray(readyShorts) ? readyShorts : []).filter((s) => {
    if (!s || !selectedTitleLc) return false;
    const sTrackLc = String(s?.track ?? '').toLowerCase();
    const sCampLc = String(s?.campaign ?? '').toLowerCase();
    return (
      sTrackLc.includes(selectedTitleLc) ||
      sCampLc.includes(selectedTitleLc) ||
      (sTrackLc && selectedTitleLc.includes(sTrackLc))
    );
  });

  const matchingMuse = (Array.isArray(museMessages) ? museMessages : []).filter((m) => {
    if (!m || !selectedTitleLc) return false;
    const mCampLc = String(m?.campaign ?? '').toLowerCase();
    const mMsgLc = String(m?.message ?? '').toLowerCase();
    return mCampLc.includes(selectedTitleLc) || mMsgLc.includes(selectedTitleLc);
  });

  const daypartWarning = checkDaypartViolation(cohort, approveSlot);

  const cardSurface = isDarkMode
    ? 'bg-slate-900/90 border-slate-800 text-slate-100'
    : 'bg-white border-slate-200 text-slate-900';
  const subSurface = isDarkMode
    ? 'bg-slate-950/80 border-slate-800 text-slate-200'
    : 'bg-slate-50 border-slate-200 text-slate-800';
  const mutedText = isDarkMode ? 'text-slate-400' : 'text-slate-600';

  return (
    <div className="space-y-6">
      {/* ACTIVE PROJECT COORDINATION HEADER */}
      <section className={`rounded-2xl border p-4 sm:p-5 ${cardSurface}`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className={`text-xs font-mono ${mutedText}`}>
              {selectedTrack.id} · {selectedTrack.ep} · {selectedTrack.genre} · {selectedTrack.bpm} BPM · {selectedTrack.key}
            </div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight mt-0.5 truncate">
              {selectedTrack.title} — Production & Social Coordination
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {servers.length > 0 && (
              <select
                value={activeServerId}
                onChange={(e) => {
                  const nextSrv = e.target.value;
                  setActiveServerId(nextSrv);
                  loadProjectCoordination(trackSlugInput, nextSrv);
                }}
                className={`min-h-[44px] px-3 py-2 rounded-xl border text-xs font-medium cursor-pointer ${
                  isDarkMode ? 'bg-slate-950 border-slate-700 text-cyan-300' : 'bg-white border-slate-300 text-slate-900'
                }`}
                aria-label="Select MCP endpoint"
              >
                {servers.map((srv) => (
                  <option key={srv.id} value={srv.id}>
                    MCP: {srv.name}
                  </option>
                ))}
              </select>
            )}

            <select
              value={selectedTrack.id}
              onChange={(e) => {
                const found = tracks.find((t) => t.id === e.target.value);
                if (found) onSelectTrack(found);
              }}
              className={`min-h-[44px] px-3 py-2 rounded-xl border text-xs font-medium cursor-pointer ${
                isDarkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
              }`}
              aria-label="Select active track"
            >
              {tracks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.id}: {t.title}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={trackSlugInput}
                onChange={(e) => setTrackSlugInput(e.target.value)}
                placeholder="MCP track_slug"
                className={`min-h-[44px] w-44 px-3 py-2 rounded-xl border text-xs font-mono ${
                  isDarkMode ? 'bg-slate-950 border-slate-700 text-cyan-300' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
              <button
                type="button"
                onClick={() => loadProjectCoordination(trackSlugInput)}
                disabled={isLoadingCoord}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingCoord ? 'animate-spin' : ''}`} />
                <span>Sync MCP State</span>
              </button>
            </div>
          </div>
        </div>

        {coordError && (
          <div className="mt-3 p-3 rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-300 text-xs font-mono">
            {coordError}
          </div>
        )}

        {/* Deep Links into Studio Subsystems */}
        <div className="mt-4 pt-3 border-t border-slate-800/40 flex flex-wrap items-center gap-2">
          {[
            { id: 'lyrics', label: 'Lyrics & Suno' },
            { id: 'nextcloud_sync', label: 'Nextcloud Files' },
            { id: 'mixer', label: 'Mini-DAW Mixer' },
            { id: 'mastering', label: 'Mastering (-12 LUFS)' },
            { id: 'veo_visuals', label: 'Veo 3 Visuals' },
            { id: 'youtube', label: 'YouTube Packaging' },
            { id: 'omnipost', label: 'OmniPost Scheduler' }
          ].map((dest) => (
            <button
              key={dest.id}
              type="button"
              onClick={() => onNavigateToTab(dest.id)}
              className={`min-h-[40px] px-3 py-1.5 rounded-lg border text-xs font-medium transition cursor-pointer ${
                isDarkMode
                  ? 'bg-slate-950 border-slate-800 hover:border-indigo-500/60 text-slate-200'
                  : 'bg-slate-50 border-slate-200 hover:border-indigo-400 text-slate-800'
              }`}
            >
              {dest.label}
            </button>
          ))}
        </div>
      </section>

      {/* COHORT & CANONICAL PLAYLIST GUARDRAILS + OUTLET SLOTS FOR THIS PROJECT */}
      <section className={`rounded-2xl border p-4 sm:p-5 space-y-4 ${cardSurface}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold">Outlets, Cohort Dayparting & Canonical Playlist Funnel</h3>
            <p className={`text-xs mt-0.5 ${mutedText}`}>
              Enforces brick co-visitation playlist routing and Cohort A–D EST scheduling rules per outlet.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={cohort}
              onChange={(e) => {
                const nextCohort = e.target.value;
                setCohort(nextCohort);
                onSaveOutletStatus({
                  trackId: selectedTrack.id,
                  outletKey: 'youtube_shorts',
                  status: primaryOutletRecord?.status || 'Drafting',
                  cohort: nextCohort,
                  playlistId
                });
              }}
              className={`min-h-[40px] px-3 py-1.5 rounded-lg border text-xs font-medium ${
                isDarkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
              }`}
            >
              {COHORT_RULES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.id}: {c.name}
                </option>
              ))}
            </select>
            <select
              value={playlistId}
              onChange={(e) => {
                const nextPl = e.target.value;
                setPlaylistId(nextPl);
                onSaveOutletStatus({
                  trackId: selectedTrack.id,
                  outletKey: 'youtube_shorts',
                  status: primaryOutletRecord?.status || 'Drafting',
                  cohort,
                  playlistId: nextPl
                });
              }}
              className={`min-h-[40px] max-w-xs px-3 py-1.5 rounded-lg border text-xs font-mono ${
                isDarkMode ? 'bg-slate-950 border-slate-700 text-cyan-300' : 'bg-white border-slate-300 text-slate-900'
              }`}
            >
              {CANONICAL_PLAYLISTS.map((pl) => (
                <option key={pl.id} value={pl.id}>
                  {pl.id} — {pl.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={`text-xs font-mono p-2.5 rounded-xl border ${subSurface}`}>
          Permitted Window for {cohort}: {COHORT_RULES.find((c) => c.id === cohort)?.window} · Playlist Funnel Query: &list={playlistId}
        </div>

        {daypartWarning && (
          <div className="p-3 rounded-xl border border-rose-500/50 bg-rose-500/10 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{daypartWarning}</span>
          </div>
        )}

        {/* Per-Outlet Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {SOCIAL_OUTLET_DEFINITIONS.map((outlet) => {
            const rec = trackOutletRecords.find((o) => o.outletKey === outlet.key);
            const currentStatus = rec?.status || (matchingShorts.length > 0 && outlet.key === 'youtube_shorts' ? 'Scheduled' : 'Not Started');
            const slotVal = rec?.scheduledSlot || (outlet.key === 'youtube_shorts' ? matchingShorts[0]?.scheduled_slot || '' : '');
            return (
              <div key={outlet.key} className={`rounded-xl border p-3.5 space-y-2.5 ${subSurface}`}>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-semibold">{outlet.label}</div>
                    <div className={`text-[11px] ${mutedText}`}>{outlet.handle} · {outlet.source}</div>
                  </div>
                </div>
                <select
                  value={currentStatus}
                  onChange={(e) =>
                    onSaveOutletStatus({
                      trackId: selectedTrack.id,
                      outletKey: outlet.key,
                      status: e.target.value,
                      scheduledSlot: slotVal,
                      cohort,
                      playlistId,
                      postUrl: rec?.postUrl || ''
                    })
                  }
                  className={`w-full min-h-[40px] px-2.5 py-1.5 rounded-lg border text-xs font-medium ${
                    isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                >
                  {OUTLET_STATUS_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                {slotVal && (
                  <div className={`text-[11px] font-mono truncate ${mutedText}`}>Slot: {slotVal}</div>
                )}
                {rec?.postUrl && (
                  <a
                    href={rec.postUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:underline"
                  >
                    <span>Open Published Post</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ELEPHANT-GOLDFISH COORDINATION PIPELINE (2-COLUMN WORKBENCH) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* LEFT COLUMN: Track Ledger, Nextcloud Previews, Suno Strike & Playbook Runner */}
        <section className={`rounded-2xl border p-4 sm:p-5 space-y-4 ${cardSurface}`}>
          <h3 className="text-sm font-bold flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-cyan-400" />
            <span>Elephant Memory (`brickos_brain.db`), Nextcloud & Playbook Stage</span>
          </h3>

          {/* Suno Hook & Playbook Runner */}
          <div className={`rounded-xl border p-3.5 space-y-3 ${subSurface}`}>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleIngestSuno}
                disabled={isIngestingSuno}
                className="min-h-[40px] px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Scissors className="w-3.5 h-3.5" />
                <span>{isIngestingSuno ? 'Scanning Peaks...' : 'Find 00:00.00 Vocal Strikes (> -16 dB)'}</span>
              </button>

              <select
                value={playbookStage}
                onChange={(e) => setPlaybookStage(e.target.value as any)}
                className={`min-h-[40px] px-2.5 py-1.5 rounded-lg border text-xs font-mono ${
                  isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
              >
                <option value="seeds_only">seeds_only</option>
                <option value="select_seeds">select_seeds</option>
                <option value="flow_videos">flow_videos</option>
                <option value="full_pipeline">full_pipeline</option>
              </select>

              <button
                type="button"
                onClick={handleRunPlaybook}
                disabled={isRunningPlaybook}
                className="min-h-[40px] px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Clapperboard className="w-3.5 h-3.5" />
                <span>{isRunningPlaybook ? 'Dispatching...' : 'Run Playbook Stage'}</span>
              </button>
            </div>

            {/* Job Poll Row */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={jobIdInput}
                onChange={(e) => setJobIdInput(e.target.value)}
                placeholder="Home PC mcp_jobs ID to poll..."
                className={`flex-1 min-h-[40px] px-3 py-1.5 rounded-lg border text-xs font-mono ${
                  isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
              <button
                type="button"
                onClick={handleJobWait}
                disabled={isWaitingJob}
                className={`min-h-[40px] px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer ${
                  isDarkMode ? 'border-slate-700 hover:bg-slate-800 text-slate-200' : 'border-slate-300 hover:bg-slate-100 text-slate-800'
                }`}
              >
                {isWaitingJob ? 'Polling...' : 'Wait Job'}
              </button>
            </div>

            {(sunoHooksResult || playbookResult || jobWaitResult) && (
              <pre className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono max-h-40 overflow-y-auto whitespace-pre-wrap text-slate-300">
                {JSON.stringify(jobWaitResult || playbookResult || sunoHooksResult, null, 2)}
              </pre>
            )}
          </div>

          {/* Track DB & Nextcloud Preview Assets */}
          <div className="space-y-2">
            <div className={`text-xs font-medium ${mutedText}`}>
              MCP Track Record & Clickable Nextcloud Preview URLs ({trackSlugInput})
            </div>
            <pre className={`p-3 rounded-xl border text-[11px] font-mono max-h-60 overflow-y-auto whitespace-pre-wrap ${subSurface}`}>
              {isLoadingCoord
                ? 'Fetching brickos_track_sync & brickos_preview_assets...'
                : JSON.stringify(
                    {
                      trackRecord: coordData?.trackRecord ?? 'Not loaded',
                      previewAssets: coordData?.previewAssets ?? 'Not loaded'
                    },
                    null,
                    2
                  )}
            </pre>
          </div>
        </section>

        {/* RIGHT COLUMN: Goldfish 8-Check Audit, Duplicate Guard Release Approval & Rescue Evaluator */}
        <section className={`rounded-2xl border p-4 sm:p-5 space-y-4 ${cardSurface}`}>
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Goldfish 8-Check Audit, Duplicate Guard & Retention Rescue</span>
            </h3>
            <button
              type="button"
              onClick={handleRunAudit}
              disabled={isRunningAudit}
              className="min-h-[40px] px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{isRunningAudit ? 'Auditing...' : 'Run 8-Check Audit'}</span>
            </button>
          </div>

          {/* 8-Check Audit Output */}
          <pre className={`p-3 rounded-xl border text-[11px] font-mono max-h-44 overflow-y-auto whitespace-pre-wrap ${subSurface}`}>
            {coordData?.auditReport
              ? JSON.stringify(coordData.auditReport, null, 2)
              : 'Click "Run 8-Check Audit" to verify 80% safe zone, >=30% caption separation, 00:00.0 strike, playlist tunneling, and zero-URL pinned comment compliance.'}
          </pre>

          {/* Duplicate Guard Release Approval */}
          <div className={`rounded-xl border p-3.5 space-y-2.5 ${subSurface}`}>
            <div className="text-xs font-semibold">
              Approve Release & Duplicate Guard (YT @brickRedeemed · FB Page · IG @brickredeemed · IG @theknotcreations)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                value={shortCutName}
                onChange={(e) => setShortCutName(e.target.value)}
                placeholder="Short_01"
                className={`min-h-[40px] px-2.5 py-1.5 rounded-lg border text-xs font-mono ${
                  isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
              <input
                type="text"
                value={canonicalMasterFile}
                onChange={(e) => setCanonicalMasterFile(e.target.value)}
                placeholder="*_Master_v[N].mp4"
                className={`min-h-[40px] px-2.5 py-1.5 rounded-lg border text-xs font-mono ${
                  isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
              <input
                type="text"
                value={approveSlot}
                onChange={(e) => setApproveSlot(e.target.value)}
                placeholder="Scheduled EST slot"
                className={`min-h-[40px] px-2.5 py-1.5 rounded-lg border text-xs font-mono ${
                  isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>
            <button
              type="button"
              onClick={handleApproveRelease}
              disabled={isApprovingRelease}
              className="min-h-[40px] px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isApprovingRelease ? 'Checking Duplicate Guard...' : 'Stage & Run Duplicate Guard'}</span>
            </button>
            {approveResult && (
              <pre className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono max-h-28 overflow-y-auto whitespace-pre-wrap text-emerald-300">
                {JSON.stringify(approveResult, null, 2)}
              </pre>
            )}
          </div>

          {/* T+24h Freeze / T+72h Single Rescue / Ted Quality Veto Evaluator */}
          <div className={`rounded-xl border p-3.5 space-y-2.5 ${subSurface}`}>
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs font-semibold flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-amber-400" />
                <span>Retention Rescue & Ted Quality Veto Check</span>
              </div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-rose-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rescueVeto}
                  onChange={(e) => setRescueVeto(e.target.checked)}
                />
                <Ban className="w-3.5 h-3.5" />
                <span>Ted Quality Veto</span>
              </label>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <input
                type="text"
                value={rescuePostId}
                onChange={(e) => setRescuePostId(e.target.value)}
                placeholder="Post / Video ID"
                className={`min-h-[40px] px-2.5 py-1.5 rounded-lg border text-xs font-mono ${
                  isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
              <input
                type="text"
                value={rescueHours}
                onChange={(e) => setRescueHours(e.target.value)}
                placeholder="Hours since launch"
                className={`min-h-[40px] px-2.5 py-1.5 rounded-lg border text-xs font-mono ${
                  isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
              <input
                type="text"
                value={rescuePlatform}
                onChange={(e) => setRescuePlatform(e.target.value)}
                placeholder="YouTube"
                className={`min-h-[40px] px-2.5 py-1.5 rounded-lg border text-xs font-mono ${
                  isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
              <input
                type="text"
                value={rescueStayedPct}
                onChange={(e) => setRescueStayedPct(e.target.value)}
                placeholder="Stayed-to-Watch %"
                className={`min-h-[40px] px-2.5 py-1.5 rounded-lg border text-xs font-mono ${
                  isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
              <input
                type="text"
                value={rescueApvPct}
                onChange={(e) => setRescueApvPct(e.target.value)}
                placeholder="APV %"
                className={`min-h-[40px] px-2.5 py-1.5 rounded-lg border text-xs font-mono ${
                  isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
              <input
                type="text"
                value={rescueViews}
                onChange={(e) => setRescueViews(e.target.value)}
                placeholder="Views"
                className={`min-h-[40px] px-2.5 py-1.5 rounded-lg border text-xs font-mono ${
                  isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>
            <button
              type="button"
              onClick={handleCheckRescue}
              disabled={isCheckingRescue}
              className="min-h-[40px] px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isCheckingRescue ? 'Evaluating...' : 'Evaluate Rescue Window'}</span>
            </button>
            {rescueResult && (
              <pre className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono max-h-32 overflow-y-auto whitespace-pre-wrap text-amber-200">
                {JSON.stringify(rescueResult, null, 2)}
              </pre>
            )}
          </div>

          {matchingMuse.length > 0 && (
            <div className="space-y-1.5">
              <div className={`text-xs font-semibold ${mutedText}`}>
                Related Edison (Meta Muse) Notes ({matchingMuse.length})
              </div>
              {matchingMuse.slice(0, 3).map((m, idx) => (
                <div key={idx} className={`p-2.5 rounded-xl border text-xs ${subSurface}`}>
                  <div className="font-semibold text-indigo-400">
                    {m.agent} · {m.report_type}
                  </div>
                  <p className={`mt-1 leading-relaxed ${mutedText}`}>{m.message}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
