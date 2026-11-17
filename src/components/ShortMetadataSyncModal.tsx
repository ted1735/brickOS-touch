import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Send,
  Save,
  ShieldCheck,
  Music2
} from 'lucide-react';
import { Track } from '../types';
import {
  ReadyShortItem,
  YouTubeVideoStat,
  SocialOutletStatus,
  PlatformOutletLinkEntry,
  McpServerPublic,
  CANONICAL_PLAYLISTS,
  SOCIAL_OUTLET_DEFINITIONS,
  OUTLET_STATUS_OPTIONS,
  toTrackSlug,
  checkDaypartViolation,
  isSafeExternalUrl
} from '../types/mcpStatus';

export interface EditableShortPayload {
  short: ReadyShortItem;
  liveVideo?: YouTubeVideoStat | null;
  matchedTrack?: Track | null;
}

interface ShortMetadataSyncModalProps {
  isOpen: boolean;
  target: EditableShortPayload | null;
  tracks: Track[];
  servers: McpServerPublic[];
  outletStatuses: SocialOutletStatus[];
  releaseLinks?: {
    spotify_album?: string;
    spotify_track?: string;
    apple_music?: string;
    youtube_music?: string;
  };
  isDarkMode: boolean;
  onClose: () => void;
  onSynced: (result: {
    shortOverrides: any[];
    outletStatuses: SocialOutletStatus[];
    syncResults: Array<{ target: string; ok: boolean; detail: string }>;
  }) => void;
  onOpenProject: (trackTitleOrSlug: string) => void;
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const ShortMetadataSyncModal: React.FC<ShortMetadataSyncModalProps> = ({
  isOpen,
  target,
  tracks,
  servers,
  outletStatuses,
  releaseLinks,
  isDarkMode,
  onClose,
  onSynced,
  onOpenProject,
  onNotify
}) => {
  const [title, setTitle] = useState('');
  const [trackTitle, setTrackTitle] = useState('');
  const [campaign, setCampaign] = useState('');
  const [status, setStatus] = useState('READY - APPROVED FOR PUBLISHING');
  const [hookText, setHookText] = useState('');
  const [caption, setCaption] = useState('');
  const [scheduledSlot, setScheduledSlot] = useState('');
  const [playlistId, setPlaylistId] = useState<string>(CANONICAL_PLAYLISTS[0].id);
  const [youtubeId, setYoutubeId] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [spotifyUrl, setSpotifyUrl] = useState('');
  const [appleMusicUrl, setAppleMusicUrl] = useState('');
  const [youtubeMusicUrl, setYoutubeMusicUrl] = useState('');
  const [canonicalMasterFile, setCanonicalMasterFile] = useState('');
  const [notes, setNotes] = useState('');

  // Per-outlet alignment state (status, direct post/scheduled URL, item ID)
  const [outletDrafts, setOutletDrafts] = useState<Record<string, PlatformOutletLinkEntry>>({});

  // Sync target toggles
  const [syncServerId, setSyncServerId] = useState<string>('brickos-primary-mcp');
  const [syncTrackDb, setSyncTrackDb] = useState<boolean>(true);
  const [syncApproveRelease, setSyncApproveRelease] = useState<boolean>(false);
  const [syncMuseBridge, setSyncMuseBridge] = useState<boolean>(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [syncResults, setSyncResults] = useState<Array<{ target: string; ok: boolean; detail: string }>>([]);

  useEffect(() => {
    if (!isOpen || !target) return;
    const { short, liveVideo, matchedTrack } = target;
    const initialTrack = matchedTrack || tracks.find(
      (t) =>
        t?.title &&
        (t.title.toLowerCase() === (short.track || '').toLowerCase() ||
          t.title.toLowerCase() === (short.campaign || '').toLowerCase())
    );

    const resolvedYtId = short.youtube_id || liveVideo?.video_id || '';
    const resolvedYtUrl = short.youtube_url || liveVideo?.url || '';
    const resolvedSpotifyUrl = short.spotify_url || releaseLinks?.spotify_track || '';
    const resolvedAppleUrl = short.apple_music_url || releaseLinks?.apple_music || '';
    const resolvedYtMusicUrl = short.youtube_music_url || releaseLinks?.youtube_music || '';

    setTitle(short.title || liveVideo?.title || '');
    setTrackTitle(short.track || initialTrack?.title || short.campaign || '');
    setCampaign(short.campaign || initialTrack?.title || '');
    setStatus(short.status || (liveVideo ? 'LIVE ON YOUTUBE' : 'READY - APPROVED FOR PUBLISHING'));
    setHookText(short.hook_text || '');
    setCaption(short.caption || '');
    setScheduledSlot(short.scheduled_slot || '');
    setYoutubeId(resolvedYtId);
    setYoutubeUrl(resolvedYtUrl);
    setSpotifyUrl(resolvedSpotifyUrl);
    setAppleMusicUrl(resolvedAppleUrl);
    setYoutubeMusicUrl(resolvedYtMusicUrl);
    setCanonicalMasterFile('');
    setNotes('');
    setSyncResults([]);
    setSyncServerId(servers[0]?.id || 'brickos-primary-mcp');

    const initialOutlets: Record<string, PlatformOutletLinkEntry> = {};
    for (const def of SOCIAL_OUTLET_DEFINITIONS) {
      const fromShort = short.platform_links?.[def.key];
      const existing = initialTrack
        ? outletStatuses.find((o) => o?.trackId === initialTrack.id && o?.outletKey === def.key)
        : undefined;

      const defaultStatus =
        fromShort?.status ||
        existing?.status ||
        (def.key === 'youtube_shorts'
          ? liveVideo
            ? 'Published'
            : 'Scheduled'
          : def.key === 'distro_streaming'
          ? resolvedSpotifyUrl || resolvedAppleUrl
            ? 'Published'
            : 'Not Started'
          : 'Scheduled');

      const defaultUrl =
        fromShort?.postUrl ||
        existing?.postUrl ||
        (def.key === 'youtube_shorts'
          ? resolvedYtUrl
          : def.key === 'distro_streaming'
          ? resolvedSpotifyUrl || resolvedAppleUrl || resolvedYtMusicUrl
          : '');

      const defaultPostId =
        fromShort?.postId ||
        existing?.postId ||
        (def.key === 'youtube_shorts' ? resolvedYtId : '');

      initialOutlets[def.key] = {
        status: defaultStatus,
        postUrl: defaultUrl,
        postId: defaultPostId
      };

      if (def.key === 'youtube_shorts' && existing?.playlistId) {
        setPlaylistId(existing.playlistId);
      }
    }
    setOutletDrafts(initialOutlets);
  }, [isOpen, target?.short?.id, target?.liveVideo?.video_id]);

  if (!isOpen || !target) return null;

  const { short, liveVideo, matchedTrack } = target;
  const resolvedTrack =
    matchedTrack ||
    tracks.find(
      (t) =>
        t?.title &&
        (t.title.toLowerCase() === trackTitle.toLowerCase() ||
          t.title.toLowerCase() === campaign.toLowerCase())
    );
  const resolvedSlug = toTrackSlug(trackTitle || campaign || title);
  const daypartWarning = checkDaypartViolation('Cohort C', scheduledSlot);

  const updateOutletDraft = (outletKey: string, patch: Partial<PlatformOutletLinkEntry>) => {
    setOutletDrafts((prev) => {
      const current = prev[outletKey] || { status: 'Not Started', postUrl: '', postId: '' };
      return {
        ...prev,
        [outletKey]: { ...current, ...patch }
      };
    });
    if (outletKey === 'youtube_shorts') {
      if (patch.postUrl !== undefined) setYoutubeUrl(patch.postUrl);
      if (patch.postId !== undefined) setYoutubeId(patch.postId);
    }
  };

  const handleSaveAndSync = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      onNotify('Short title is required.', 'error');
      return;
    }

    setIsSubmitting(true);
    setSyncResults([]);
    try {
      const outletUpdates = SOCIAL_OUTLET_DEFINITIONS.map((def) => {
        const draft = outletDrafts[def.key] || { status: 'Not Started', postUrl: '', postId: '' };
        return {
          outletKey: def.key,
          status: draft.status || 'Not Started',
          postUrl: (draft.postUrl || '').trim(),
          postId: (draft.postId || '').trim()
        };
      });

      const res = await fetch('/api/mcp/shorts/update-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shortId: short.id,
          trackId: resolvedTrack?.id || '',
          trackSlug: resolvedSlug,
          trackTitle: trackTitle.trim(),
          campaign: campaign.trim() || trackTitle.trim(),
          status: status.trim(),
          title: title.trim(),
          hookText: hookText.trim(),
          caption,
          scheduledSlot: scheduledSlot.trim(),
          playlistId,
          youtubeId: youtubeId.trim(),
          youtubeUrl: youtubeUrl.trim(),
          spotifyUrl: spotifyUrl.trim(),
          appleMusicUrl: appleMusicUrl.trim(),
          youtubeMusicUrl: youtubeMusicUrl.trim(),
          canonicalMasterFile: canonicalMasterFile.trim(),
          videoAssetUrl: short.video_asset_url || '',
          thumbnailAssetUrl: short.thumbnail_asset_url || '',
          notes: notes.trim(),
          outletUpdates,
          syncTargets: {
            serverId: syncServerId,
            trackDb: syncTrackDb,
            approveRelease: syncApproveRelease && Boolean(canonicalMasterFile.trim()),
            museBridge: syncMuseBridge
          }
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error || `Sync failed (HTTP ${res.status})`);
      }
      setSyncResults(data.syncResults || []);
      onSynced({
        shortOverrides: data.shortOverrides || [],
        outletStatuses: data.outletStatuses || [],
        syncResults: data.syncResults || []
      });
      const failedCount = (data.syncResults || []).filter((r: any) => !r.ok).length;
      onNotify(
        failedCount === 0
          ? 'Short metadata & platform links saved & synced.'
          : `Saved locally; ${failedCount} remote MCP sync target reported a notice.`,
        failedCount === 0 ? 'success' : 'info'
      );
    } catch (err: any) {
      onNotify(err?.message || 'Failed saving Short metadata', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalBg = isDarkMode
    ? 'bg-slate-900 border-slate-700 text-slate-100'
    : 'bg-white border-slate-200 text-slate-900';
  const inputBg = isDarkMode
    ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500'
    : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400';
  const mutedText = isDarkMode ? 'text-slate-400' : 'text-slate-600';

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="short-editor-title"
    >
      <div className={`w-full max-w-5xl rounded-2xl border shadow-2xl overflow-hidden my-auto ${modalBg}`}>
        {/* Modal Header */}
        <div className={`px-5 py-4 border-b flex items-center justify-between gap-4 ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
          <div className="min-w-0">
            <div className={`text-xs font-mono truncate ${mutedText}`}>
              {short.id} · {resolvedSlug} · {liveVideo ? `Live YT (${liveVideo.views.toLocaleString()} views)` : status}
            </div>
            <h2 id="short-editor-title" className="text-base sm:text-lg font-bold truncate mt-0.5">
              Edit Short Metadata &amp; Sync Platforms
            </h2>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {resolvedTrack && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenProject(resolvedTrack.title);
                }}
                className={`min-h-[38px] px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer whitespace-nowrap ${
                  isDarkMode ? 'bg-slate-800 border-slate-700 text-indigo-300 hover:bg-slate-700' : 'bg-slate-100 border-slate-300 text-indigo-700'
                }`}
              >
                Open Project Tools
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className={`min-w-[38px] min-h-[38px] rounded-lg flex items-center justify-center cursor-pointer ${
                isDarkMode ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-600'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Two-Column Body */}
        <form onSubmit={handleSaveAndSync} className="grid grid-cols-1 lg:grid-cols-12 max-h-[82vh] overflow-y-auto">
          {/* Left Column: 9:16 Vertical Preview & Quick Telemetry */}
          <div className={`lg:col-span-4 p-5 border-b lg:border-b-0 lg:border-r space-y-4 ${isDarkMode ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50'}`}>
            <div className="aspect-[9/16] max-h-[360px] mx-auto rounded-xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center relative">
              {short.video_asset_url ? (
                <video
                  src={short.video_asset_url}
                  poster={short.thumbnail_asset_url || undefined}
                  controls
                  playsInline
                  preload="metadata"
                  className="w-full h-full object-cover"
                />
              ) : short.thumbnail_asset_url ? (
                <img
                  src={short.thumbnail_asset_url}
                  alt={title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="p-4 text-center space-y-2">
                  <Play className="w-8 h-8 text-indigo-400 mx-auto" />
                  <div className="text-xs font-medium text-slate-300">9:16 Vertical Short</div>
                  <div className="text-[11px] font-mono text-slate-500">
                    {youtubeId ? `YT ID: ${youtubeId}` : 'Staged in Studio'}
                  </div>
                </div>
              )}
            </div>

            <div className={`text-xs space-y-1.5 font-mono tabular-nums ${mutedText}`}>
              <div className="flex justify-between gap-2">
                <span>Format:</span>
                <span className={isDarkMode ? 'text-slate-200' : 'text-slate-800'}>{short.format || '9:16 · 1080x1920'}</span>
              </div>
              {short.duration && (
                <div className="flex justify-between gap-2">
                  <span>Duration:</span>
                  <span className={isDarkMode ? 'text-slate-200' : 'text-slate-800'}>{short.duration}</span>
                </div>
              )}
              {liveVideo && (
                <>
                  <div className="flex justify-between gap-2">
                    <span>YouTube Views:</span>
                    <span className="text-cyan-400 font-semibold">{(liveVideo.views ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span>Likes / Ratio:</span>
                    <span className="text-emerald-400 font-semibold">{liveVideo.likes ?? 0} ({liveVideo.like_to_view_pct ?? 0}%)</span>
                  </div>
                </>
              )}
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {youtubeUrl && (
                <a
                  href={youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 min-h-[38px] px-3 py-1.5 rounded-lg border border-rose-500/40 bg-rose-500/10 text-rose-300 text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-rose-500/20"
                >
                  <span>YouTube</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {short.video_asset_url && (
                <a
                  href={short.video_asset_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 min-h-[38px] px-3 py-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/10 text-cyan-300 text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-cyan-500/20"
                >
                  <span>Master MP4</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>

          {/* Right Column: Metadata Form + Multi-Platform Outlets + Sync Controls */}
          <div className="lg:col-span-8 p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className={`block text-xs font-semibold mb-1 ${mutedText}`}>Short Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`w-full min-h-[40px] px-3 py-1.5 rounded-lg border text-sm font-medium ${inputBg}`}
                  required
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${mutedText}`}>Linked Catalog Track</label>
                <input
                  type="text"
                  value={trackTitle}
                  onChange={(e) => setTrackTitle(e.target.value)}
                  placeholder="e.g. Blindfold Blessing"
                  className={`w-full min-h-[40px] px-3 py-1.5 rounded-lg border text-xs ${inputBg}`}
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${mutedText}`}>00:00 Opening Hook Text</label>
                <input
                  type="text"
                  value={hookText}
                  onChange={(e) => setHookText(e.target.value)}
                  placeholder="Bold on-screen strike hook"
                  className={`w-full min-h-[40px] px-3 py-1.5 rounded-lg border text-xs font-mono text-amber-400 ${inputBg}`}
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${mutedText}`}>Scheduled EST Slot</label>
                <input
                  type="text"
                  value={scheduledSlot}
                  onChange={(e) => setScheduledSlot(e.target.value)}
                  placeholder="e.g. Saturday Nov 21 @ 05:15 AM EST"
                  className={`w-full min-h-[40px] px-3 py-1.5 rounded-lg border text-xs font-mono ${inputBg}`}
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${mutedText}`}>Canonical Co-Visitation Playlist</label>
                <select
                  value={playlistId}
                  onChange={(e) => setPlaylistId(e.target.value)}
                  className={`w-full min-h-[40px] px-2.5 py-1.5 rounded-lg border text-xs cursor-pointer ${inputBg}`}
                >
                  {CANONICAL_PLAYLISTS.map((pl) => (
                    <option key={pl.id} value={pl.id}>
                      {pl.id} — {pl.name.slice(0, 44)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {daypartWarning && (
              <div className="p-2.5 rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{daypartWarning}</span>
              </div>
            )}

            <div>
              <label className={`block text-xs font-semibold mb-1 ${mutedText}`}>Caption, Script &amp; Hashtags</label>
              <textarea
                rows={4}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Cross-platform caption with streaming links and hashtags..."
                className={`w-full px-3 py-2 rounded-lg border text-xs leading-relaxed ${inputBg}`}
              />
            </div>

            {/* Platform URLs (YouTube + DistroKid Streaming Links) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={`block text-xs font-semibold mb-1 ${mutedText}`}>YouTube Video / Short ID</label>
                <input
                  type="text"
                  value={youtubeId}
                  onChange={(e) => {
                    const val = e.target.value;
                    setYoutubeId(val);
                    updateOutletDraft('youtube_shorts', { postId: val });
                  }}
                  placeholder="OVjC20xByzE"
                  className={`w-full min-h-[38px] px-3 py-1 rounded-lg border text-xs font-mono tabular-nums ${inputBg}`}
                />
              </div>
              <div>
                <label className={`block text-xs font-semibold mb-1 ${mutedText}`}>YouTube Short URL</label>
                <input
                  type="url"
                  value={youtubeUrl}
                  onChange={(e) => {
                    const val = e.target.value;
                    setYoutubeUrl(val);
                    updateOutletDraft('youtube_shorts', { postUrl: val });
                  }}
                  placeholder="https://youtube.com/shorts/..."
                  className={`w-full min-h-[38px] px-3 py-1 rounded-lg border text-xs font-mono ${inputBg}`}
                />
              </div>
              <div>
                <label className={`block text-xs font-semibold mb-1 flex items-center gap-1 ${mutedText}`}>
                  <Music2 className="w-3 h-3 text-emerald-400" />
                  <span>Spotify URL (DistroKid)</span>
                </label>
                <input
                  type="url"
                  value={spotifyUrl}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSpotifyUrl(val);
                    if (val) updateOutletDraft('distro_streaming', { postUrl: val });
                  }}
                  placeholder="https://open.spotify.com/track/..."
                  className={`w-full min-h-[38px] px-3 py-1 rounded-lg border text-xs font-mono ${inputBg}`}
                />
              </div>
              <div>
                <label className={`block text-xs font-semibold mb-1 ${mutedText}`}>Apple Music URL (DistroKid)</label>
                <input
                  type="url"
                  value={appleMusicUrl}
                  onChange={(e) => setAppleMusicUrl(e.target.value)}
                  placeholder="https://music.apple.com/..."
                  className={`w-full min-h-[38px] px-3 py-1 rounded-lg border text-xs font-mono ${inputBg}`}
                />
              </div>
            </div>

            {/* Platform Alignment Statuses & Direct Post / Scheduled Links */}
            <div className="space-y-2.5 pt-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className={`text-xs font-semibold ${mutedText}`}>
                  Platform Alignment &amp; Direct Links {resolvedTrack ? `(${resolvedTrack.id})` : ''}
                </div>
                <div className={`text-[11px] ${mutedText}`}>
                  Direct links open scheduled items, Reels, TikToks &amp; posts
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {SOCIAL_OUTLET_DEFINITIONS.map((def) => {
                  const draft = outletDrafts[def.key] || { status: 'Not Started', postUrl: '', postId: '' };
                  const hasValidUrl = isSafeExternalUrl(draft.postUrl);
                  const placeholderByOutlet: Record<string, { url: string; id: string }> = {
                    youtube_shorts: { url: 'https://youtube.com/shorts/...', id: 'YouTube Video ID' },
                    tiktok: { url: 'https://www.tiktok.com/@brickredeemed/video/...', id: 'TikTok Video ID' },
                    instagram_reels: { url: 'https://www.instagram.com/reel/...', id: 'IG Media / Sched ID' },
                    facebook_x: { url: 'https://www.facebook.com/... or https://x.com/...', id: 'FB / X Post ID' },
                    distro_streaming: { url: 'https://open.spotify.com/track/...', id: 'UPC / ISRC / Release ID' }
                  };
                  const ph = placeholderByOutlet[def.key] || { url: 'https://...', id: 'Item ID' };

                  return (
                    <div
                      key={def.key}
                      className={`rounded-xl border p-3 space-y-2 ${
                        isDarkMode ? 'border-slate-800 bg-slate-950/70' : 'border-slate-200 bg-slate-50/80'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-xs font-semibold truncate">{def.label}</div>
                          <div className={`text-[10px] truncate ${mutedText}`}>{def.handle}</div>
                        </div>
                        <select
                          value={draft.status || 'Not Started'}
                          onChange={(e) => updateOutletDraft(def.key, { status: e.target.value })}
                          aria-label={`${def.label} release status`}
                          className={`min-h-[34px] px-2 py-1 rounded-lg border text-[11px] font-medium cursor-pointer shrink-0 ${inputBg}`}
                        >
                          {OUTLET_STATUS_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <input
                          type="url"
                          value={draft.postUrl}
                          onChange={(e) => updateOutletDraft(def.key, { postUrl: e.target.value })}
                          placeholder={ph.url}
                          aria-label={`${def.label} direct post or scheduled URL`}
                          className={`flex-1 min-w-0 min-h-[34px] px-2.5 py-1 rounded-lg border text-[11px] font-mono ${inputBg}`}
                        />
                        {hasValidUrl ? (
                          <a
                            href={draft.postUrl.trim()}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={`Open ${def.label} post or scheduled item`}
                            aria-label={`Open ${def.label} link in new tab`}
                            className="min-h-[34px] px-2.5 py-1 rounded-lg border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-[11px] font-semibold inline-flex items-center gap-1 shrink-0"
                          >
                            <span>Open</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span
                            className={`min-h-[34px] px-2.5 py-1 rounded-lg border text-[11px] inline-flex items-center shrink-0 opacity-45 ${
                              isDarkMode ? 'border-slate-800 text-slate-500' : 'border-slate-300 text-slate-400'
                            }`}
                          >
                            No Link
                          </span>
                        )}
                      </div>

                      <div>
                        <input
                          type="text"
                          value={draft.postId}
                          onChange={(e) => updateOutletDraft(def.key, { postId: e.target.value })}
                          placeholder={ph.id}
                          aria-label={`${def.label} item or scheduled post ID`}
                          className={`w-full min-h-[32px] px-2.5 py-1 rounded-lg border text-[11px] font-mono tabular-nums ${inputBg}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Multi-Platform Sync Dispatch Options */}
            <div className={`rounded-xl border p-3.5 space-y-2.5 ${isDarkMode ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50'}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Sync Targets on Save</span>
                </span>
                {servers.length > 0 && (
                  <select
                    value={syncServerId}
                    onChange={(e) => setSyncServerId(e.target.value)}
                    className={`min-h-[32px] px-2 py-1 rounded-lg border text-[11px] font-mono ${inputBg}`}
                  >
                    {servers.map((srv) => (
                      <option key={srv.id} value={srv.id}>
                        Endpoint: {srv.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={syncTrackDb}
                    onChange={(e) => setSyncTrackDb(e.target.checked)}
                    className="rounded border-slate-600 text-indigo-500"
                  />
                  <span>brickOS MCP Track DB</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={syncMuseBridge}
                    onChange={(e) => setSyncMuseBridge(e.target.checked)}
                    className="rounded border-slate-600 text-indigo-500"
                  />
                  <span>Meta Muse (Edison IG/FB)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={syncApproveRelease}
                    onChange={(e) => setSyncApproveRelease(e.target.checked)}
                    className="rounded border-slate-600 text-indigo-500"
                  />
                  <span>Duplicate Guard Stage</span>
                </label>
              </div>

              {syncApproveRelease && (
                <div>
                  <input
                    type="text"
                    value={canonicalMasterFile}
                    onChange={(e) => setCanonicalMasterFile(e.target.value)}
                    placeholder="Canonical Master File for Duplicate Guard (e.g. Short_02_26s_Sunday_Master_v2.mp4)"
                    className={`w-full min-h-[36px] px-3 py-1 rounded-lg border text-xs font-mono ${inputBg}`}
                  />
                </div>
              )}
            </div>

            {/* Live Sync Feedback */}
            {syncResults.length > 0 && (
              <div className="space-y-1.5">
                {syncResults.map((res, idx) => (
                  <div
                    key={idx}
                    className={`px-3 py-2 rounded-lg border text-xs flex items-center gap-2 ${
                      res.ok
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                        : 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                    }`}
                  >
                    {res.ok ? (
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    ) : (
                      <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                    )}
                    <span className="font-semibold">{res.target}:</span>
                    <span className="truncate">{res.detail}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Footer Action Bar */}
            <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-800/40">
              <button
                type="button"
                onClick={onClose}
                className={`min-h-[42px] px-4 py-2 rounded-xl border text-xs font-semibold cursor-pointer ${
                  isDarkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Close
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="min-h-[42px] px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 cursor-pointer whitespace-nowrap"
              >
                {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>{isSubmitting ? 'Saving & Syncing...' : 'Save & Sync Selected Platforms'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
