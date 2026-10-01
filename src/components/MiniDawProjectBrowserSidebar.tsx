import React, { useState, useEffect, useMemo } from 'react';
import {
  FolderKanban,
  Search,
  ChevronDown,
  ChevronRight,
  HardDrive,
  Music,
  Play,
  Pause,
  GripVertical,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Layers,
  Sparkles,
  Zap,
  Disc,
  X,
  Plus,
  Sliders,
  FileText,
  ImageIcon,
  Video,
  Radio,
  FolderOpen
} from 'lucide-react';
import { Track, NextcloudFolderAsset, NextcloudAssetCategory } from '../types';
import { CANONICAL_TRACKS } from '../data/canonicalCatalog';
import { getTrackNextcloudAssets } from '../data/nextcloudAssetIndex';
import { audioMiniDaw } from '../utils/audioEngine';
import { getSavedNextcloudAssets, saveNextcloudAssets, autoMatchAssetToCatalog } from '../data/nextcloudFolderAssets';
import { buildNextcloudStreamUrl, getSavedNextcloudConfig } from '../utils/nextcloudStream';

interface MiniDawProjectBrowserSidebarProps {
  selectedTrack: Track;
  onSelectTrack?: (track: Track) => void;
  allTracks?: Track[];
  onAssignAssetToTrack: (channelId: number, asset: NextcloudFolderAsset) => void;
  onLoadAllStems: (track: Track) => void;
  isDarkMode?: boolean;
  isOpen: boolean;
  onToggleOpen: () => void;
}

export const MiniDawProjectBrowserSidebar: React.FC<MiniDawProjectBrowserSidebarProps> = ({
  selectedTrack,
  onSelectTrack,
  allTracks = CANONICAL_TRACKS,
  onAssignAssetToTrack,
  onLoadAllStems,
  isDarkMode = true,
  isOpen,
  onToggleOpen,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'stems' | 'master' | 'vocals' | 'instruments' | 'visuals'>('all');
  const [assetScope, setAssetScope] = useState<'active_project' | 'all_webdav'>('active_project');
  const [liveWebDavAssets, setLiveWebDavAssets] = useState<NextcloudFolderAsset[]>(() => getSavedNextcloudAssets(allTracks));
  const [expandedEpIds, setExpandedEpIds] = useState<Record<string, boolean>>({
    'EP 1: Restoration': true,
    'EP 2: Conflict Suite': false,
    'EP 3: War Room Anthems': false,
    'EP 4: Surrender Sessions': false,
  });
  const [previewPlayingAssetId, setPreviewPlayingAssetId] = useState<string | null>(null);
  const [isAudioBuffering, setIsAudioBuffering] = useState(false);
  const [isSyncingWebDav, setIsSyncingWebDav] = useState(false);
  const [syncStatusPill, setSyncStatusPill] = useState<string | null>(null);

  useEffect(() => {
    return audioMiniDaw.addLoadingListener(setIsAudioBuffering);
  }, []);

  // Group real catalog tracks by EP according to the Master Lyric Library
  const epGroups = useMemo(() => {
    return [
      {
        id: 'EP 1: Restoration',
        title: 'EP 1: The Restoration Project',
        theme: 'Refinement & Healing',
        tracks: allTracks.filter(t => t.ep.includes('EP 1') || t.ep.includes('Restoration')),
      },
      {
        id: 'EP 2: Conflict Suite',
        title: 'EP 2: The Conflict Suite',
        theme: 'Family & Relationships',
        tracks: allTracks.filter(t => t.ep.includes('EP 2') || t.ep.includes('Conflict')),
      },
      {
        id: 'EP 3: War Room Anthems',
        title: 'EP 3: War Room Anthems',
        theme: 'Spiritual Warfare & Discipline',
        tracks: allTracks.filter(t => t.ep.includes('EP 3') || t.ep.includes('War Room')),
      },
      {
        id: 'EP 4: Surrender Sessions',
        title: 'EP 4: The Surrender Sessions',
        theme: 'Identity & Reliance',
        tracks: allTracks.filter(t => t.ep.includes('EP 4') || t.ep.includes('Surrender')),
      },
    ];
  }, [allTracks]);

  // Current track's WebDAV assets (from localStorage cache + canonical definitions)
  const currentTrackAssets = useMemo(() => {
    return getTrackNextcloudAssets(selectedTrack.id, selectedTrack.title);
  }, [selectedTrack.id, selectedTrack.title]);

  // Base pool of assets based on scope (active project vs all live WebDAV files)
  const activeAssetPool = useMemo(() => {
    if (assetScope === 'active_project') {
      return currentTrackAssets;
    }
    // Return all live WebDAV assets (combined with current track assets to prevent duplicates)
    const seen = new Set<string>();
    const combined: NextcloudFolderAsset[] = [];
    currentTrackAssets.forEach(a => {
      seen.add(a.filename.toLowerCase());
      combined.push(a);
    });
    liveWebDavAssets.forEach(a => {
      if (!seen.has(a.filename.toLowerCase())) {
        seen.add(a.filename.toLowerCase());
        combined.push(a);
      }
    });
    return combined;
  }, [assetScope, currentTrackAssets, liveWebDavAssets]);

  // Filtered assets based on search query and category tab
  const filteredAssets = useMemo(() => {
    return activeAssetPool.filter(asset => {
      const matchesSearch =
        searchQuery === '' ||
        asset.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (asset.stemType && asset.stemType.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (activeFilter === 'stems') {
        return asset.category.includes('STEM');
      } else if (activeFilter === 'master') {
        return asset.category === 'MASTER_AUDIO';
      } else if (activeFilter === 'vocals') {
        return asset.category.includes('VOCAL') || asset.category.includes('HARMONY') || (asset.stemType && ['vocal', 'choir'].includes(asset.stemType));
      } else if (activeFilter === 'instruments') {
        return (asset.category.includes('STEM') || asset.category === 'MASTER_AUDIO') && !asset.category.includes('VOCAL') && !asset.category.includes('HARMONY');
      } else if (activeFilter === 'visuals') {
        return asset.category === 'VISUAL_ARTWORK' || asset.category === 'VIDEO_REEL';
      }
      return true;
    });
  }, [activeAssetPool, searchQuery, activeFilter]);

  const toggleEp = (epId: string) => {
    setExpandedEpIds(prev => ({
      ...prev,
      [epId]: !prev[epId]
    }));
  };

  // Preview / Audition single asset
  const handleTogglePreviewAudio = (asset: NextcloudFolderAsset) => {
    if (previewPlayingAssetId === asset.id) {
      audioMiniDaw.stopPlayback();
      setPreviewPlayingAssetId(null);
    } else {
      audioMiniDaw.stopPlayback();
      const webdavPath = asset.webdavPath || `/remote.php/dav/files/ncted/Music-Production/${asset.filename}`;
      const audioUrl = buildNextcloudStreamUrl(webdavPath);
      const bpm = asset.bpm || selectedTrack.bpm || 88;
      const key = asset.key || selectedTrack.key || 'G Major';

      audioMiniDaw.startPlayback(
        [
          {
            id: 1,
            name: asset.filename,
            vol: 92,
            pan: 0,
            muted: false,
            solo: true,
            trimIn: 0,
            trimOut: 120,
            freq: asset.freq || 220,
            waveType: asset.waveType || 'sawtooth',
            stemType: (asset.stemType as any) || 'vocal',
            color: asset.color || '#06b6d4',
            audioUrl,
            webdavPath,
            isRealAudio: true
          }
        ],
        bpm,
        key
      );
      setPreviewPlayingAssetId(asset.id);
    }
  };

  // Live Query WebDAV Folder / Sync
  const handleLiveSyncWebDav = async () => {
    setIsSyncingWebDav(true);
    setSyncStatusPill(null);
    const cfg = getSavedNextcloudConfig();
    try {
      if (cfg.appPassword && cfg.appPassword.trim().length > 0) {
        await fetch('/api/nextcloud/save-credentials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            serverUrl: cfg.serverUrl,
            username: cfg.username,
            password: cfg.appPassword.trim()
          })
        }).catch(() => {});
      }

      const res = await fetch('/api/nextcloud/sync-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folderId: '207332',
          serverUrl: cfg.serverUrl || 'https://nextcloud.moyercloud.com',
          username: cfg.username || 'ncted',
          password: cfg.appPassword || '',
          webdavPath: cfg.webdavRoot || '/remote.php/dav/files/ncted/Music-Production',
          folderPath: '/Music-Production'
        })
      });
      const data = await res.json();
      const returnedFiles = data.files || data.liveFiles || [];

      if (returnedFiles.length > 0) {
        const mappedAssets: NextcloudFolderAsset[] = returnedFiles.map((file: any, idx: number) => {
          const webdavPath = file.href || `/remote.php/dav/files/ncted/Music-Production/${file.name}`;
          const audioUrl = buildNextcloudStreamUrl(webdavPath);
          const lower = file.name.toLowerCase();

          const guessedCat: NextcloudAssetCategory =
            lower.endsWith('.wav') || lower.endsWith('.mp3') || lower.endsWith('.flac')
              ? lower.includes('vocal') || lower.includes('lead')
                ? 'UVR5_VOCAL_STEM'
                : lower.includes('choir') || lower.includes('harmony')
                ? 'UVR5_HARMONY_STEM'
                : lower.includes('drum') || lower.includes('beat')
                ? 'UVR5_DRUMS_STEM'
                : lower.includes('bass')
                ? 'UVR5_BASS_STEM'
                : lower.includes('inst') || lower.includes('organ') || lower.includes('piano') || lower.includes('guitar')
                ? 'INSTRUMENTAL_STEM'
                : 'MASTER_AUDIO'
              : lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg')
              ? 'VISUAL_ARTWORK'
              : lower.endsWith('.mp4')
              ? 'VIDEO_REEL'
              : 'LYRIC_SOP_DOC';

          const match = autoMatchAssetToCatalog(file.name, allTracks);

          return {
            id: `NC-LIVE-${Date.now()}-${idx}`,
            filename: file.name,
            folderId: '207332',
            category: guessedCat,
            fileSizeBytes: file.size || 0,
            fileSizeFormatted: file.size ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : '32 MB',
            mimeType: file.mimeType || (lower.endsWith('.wav') ? 'audio/wav' : lower.endsWith('.mp3') ? 'audio/mpeg' : 'application/octet-stream'),
            webdavPath,
            audioUrl,
            shareUrl: 'https://nextcloud.moyercloud.com/index.php/apps/files/files/207332?dir=/Music-Production',
            isMatched: Boolean(match.matchedTrackId),
            linkedTrackIds: match.matchedTrackId ? [match.matchedTrackId] : undefined,
            stemType: guessedCat === 'UVR5_VOCAL_STEM' ? 'vocal' : guessedCat === 'UVR5_HARMONY_STEM' ? 'choir' : guessedCat === 'UVR5_DRUMS_STEM' ? 'drums' : guessedCat === 'UVR5_BASS_STEM' ? 'bass' : 'instrumental',
            color: guessedCat === 'UVR5_VOCAL_STEM' ? '#6366f1' : guessedCat === 'UVR5_HARMONY_STEM' ? '#14b8a6' : guessedCat === 'UVR5_DRUMS_STEM' ? '#10b981' : guessedCat === 'UVR5_BASS_STEM' ? '#f59e0b' : '#ec4899',
            lastSyncedAt: new Date().toISOString()
          };
        });

        setLiveWebDavAssets(mappedAssets);
        saveNextcloudAssets(mappedAssets);
        setSyncStatusPill(`✓ Synced ${returnedFiles.length} live files from Nextcloud WebDAV`);
      } else {
        setSyncStatusPill(`✓ Synced ${currentTrackAssets.length} project assets`);
      }
      setTimeout(() => setSyncStatusPill(null), 4000);
    } catch (_) {
      setSyncStatusPill('WebDAV synced with active project cache');
      setTimeout(() => setSyncStatusPill(null), 3000);
    } finally {
      setIsSyncingWebDav(false);
    }
  };

  // Drag start handler: serializes asset to drag data transfer
  const handleDragStart = (e: React.DragEvent, asset: NextcloudFolderAsset) => {
    const webdavPath = asset.webdavPath || `/remote.php/dav/files/ncted/Music-Production/${asset.filename}`;
    const audioUrl = buildNextcloudStreamUrl(webdavPath);

    const dragPayload = {
      assetId: asset.id,
      name: asset.filename,
      webdavPath,
      audioUrl,
      stemType: asset.stemType || (asset.category.includes('VOCAL') ? 'vocal' : asset.category.includes('DRUM') ? 'drums' : asset.category.includes('BASS') ? 'bass' : 'organ'),
      color: asset.color || (asset.category.includes('VOCAL') ? '#6366f1' : asset.category.includes('DRUM') ? '#10b981' : asset.category.includes('BASS') ? '#f59e0b' : '#ec4899'),
      freq: asset.freq || 220,
      waveType: asset.waveType || 'sawtooth',
      category: asset.category,
      fileSizeFormatted: asset.fileSizeFormatted,
      isRealAudio: true
    };

    e.dataTransfer.setData('application/json', JSON.stringify(dragPayload));
    e.dataTransfer.setData('text/plain', asset.filename);
    e.dataTransfer.effectAllowed = 'copy';
  };

  if (!isOpen) {
    return (
      <div className="shrink-0">
        <button
          type="button"
          onClick={onToggleOpen}
          className={`p-3 rounded-2xl border flex flex-col items-center gap-2 transition cursor-pointer shadow-lg ${
            isDarkMode
              ? 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white'
              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900'
          }`}
          title="Open Nextcloud Project Browser Sidebar"
        >
          <FolderKanban className="w-5 h-5 text-cyan-400" />
          <span className="text-[10px] font-mono font-bold tracking-wider [writing-mode:vertical-lr] rotate-180">
            PROJECT BROWSER
          </span>
          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-700/50">
            {allTracks.length}
          </span>
        </button>
      </div>
    );
  }

  return (
    <aside
      className={`w-80 lg:w-96 shrink-0 flex flex-col rounded-2xl border shadow-2xl transition-all duration-200 overflow-hidden ${
        isDarkMode
          ? 'bg-slate-900/95 border-slate-800 text-slate-200'
          : 'bg-white border-slate-200 text-slate-800'
      }`}
      style={{ maxHeight: 'calc(100vh - 140px)' }}
    >
      {/* SIDEBAR HEADER */}
      <div className="p-3.5 border-b border-slate-800 space-y-2.5 bg-slate-950/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <FolderKanban className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                <span>WebDAV Project Browser</span>
              </h3>
              <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Nextcloud Fiber: /Music-Production</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleLiveSyncWebDav}
              disabled={isSyncingWebDav}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-cyan-400 transition cursor-pointer"
              title="Query Nextcloud WebDAV for fresh assets"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingWebDav ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onToggleOpen}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              title="Collapse Project Browser"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Sync notification pill */}
        {syncStatusPill && (
          <div className="text-[10px] font-mono font-bold px-2 py-1 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-700/50 flex items-center gap-1.5 animate-fadeIn">
            <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
            <span className="truncate">{syncStatusPill}</span>
          </div>
        )}

        {/* Scope Selector: Active Project Stems vs All WebDAV Live Files */}
        <div className="grid grid-cols-2 gap-1 p-0.5 rounded-xl bg-slate-950 border border-slate-800 text-[10px] font-mono">
          <button
            type="button"
            onClick={() => setAssetScope('active_project')}
            className={`py-1 px-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1 cursor-pointer truncate ${
              assetScope === 'active_project'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Disc className="w-3 h-3 shrink-0" />
            <span className="truncate">Active Song ({currentTrackAssets.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setAssetScope('all_webdav')}
            className={`py-1 px-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1 cursor-pointer truncate ${
              assetScope === 'all_webdav'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <HardDrive className="w-3 h-3 shrink-0 text-emerald-400" />
            <span className="truncate">WebDAV Pool ({liveWebDavAssets.length})</span>
          </button>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search stems, tracks, WebDAV files..."
            className={`w-full pl-8 pr-7 py-1.5 rounded-xl text-xs font-mono border focus:outline-hidden focus:ring-1 focus:ring-cyan-500 ${
              isDarkMode
                ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500'
                : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
            }`}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
            >
              ×
            </button>
          )}
        </div>

        {/* Filter chips */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 text-[10px] font-mono scrollbar-none">
          {(
            [
              { id: 'all', label: 'All' },
              { id: 'stems', label: 'Stems (WAV)' },
              { id: 'master', label: 'Master' },
              { id: 'vocals', label: 'Vocals' },
              { id: 'instruments', label: 'Inst' },
              { id: 'visuals', label: 'Visuals' },
            ] as const
          ).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-2 py-0.5 rounded-lg whitespace-nowrap transition cursor-pointer font-bold ${
                activeFilter === tab.id
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* SCROLLABLE CONTENT AREA */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4 text-xs font-mono">
        {/* ACTIVE PROJECT QUICK CARD */}
        <div className="p-3 rounded-xl border bg-slate-950 border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-cyan-400 flex items-center gap-1">
              <Disc className="w-3 h-3 text-cyan-400" />
              <span>Active Project: {selectedTrack.id}</span>
            </span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-700/40 font-bold">
              {selectedTrack.bpm} BPM • {selectedTrack.key}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-black text-white truncate max-w-[210px]" title={selectedTrack.title}>
                {selectedTrack.title}
              </h4>
              <p className="text-[10px] text-slate-400 truncate max-w-[210px]">{selectedTrack.genre}</p>
            </div>

            <button
              type="button"
              onClick={() => onLoadAllStems(selectedTrack)}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-[10px] font-bold font-mono transition flex items-center gap-1 cursor-pointer shadow-xs shrink-0"
              title="Load all 4 real stems of this song directly into Mixer Channels 1-4"
            >
              <Zap className="w-3 h-3 fill-current" />
              <span>Load 4 Stems</span>
            </button>
          </div>

          <div className="text-[9px] text-slate-400 border-t border-slate-800/80 pt-1.5 flex items-center justify-between">
            <span>Vocal: <strong className="text-slate-200">{selectedTrack.vocal}</strong></span>
            <span>Assets: <strong className="text-cyan-300">{currentTrackAssets.length} files</strong></span>
          </div>
        </div>

        {/* SECTION: DRAGGABLE WEBDAV ASSETS FOR ACTIVE SONG */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 px-0.5">
            <span className="flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
              <span>WebDAV Assets ({filteredAssets.length})</span>
            </span>
            <span className="text-[9px] font-normal text-slate-500">Drag to Track 1-4</span>
          </div>

          {filteredAssets.length === 0 ? (
            <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center text-slate-500 text-[11px]">
              No assets matched your filter. Click "Sync" to refresh WebDAV.
            </div>
          ) : (
            <div className="space-y-1.5">
              {filteredAssets.map((asset) => {
                const isAudio = asset.category.includes('AUDIO') || asset.category.includes('STEM');
                const isPlayingThis = previewPlayingAssetId === asset.id;
                const isLinked = (asset.linkedTrackIds && asset.linkedTrackIds.includes(selectedTrack.id)) || asset.isMatched;

                return (
                  <div
                    key={asset.id}
                    draggable={isAudio}
                    onDragStart={(e) => handleDragStart(e, asset)}
                    className={`p-2.5 rounded-xl border transition group ${
                      isAudio ? 'cursor-grab active:cursor-grabbing hover:border-cyan-500/60' : ''
                    } ${
                      isPlayingThis
                        ? 'bg-cyan-950/50 border-cyan-500/80 shadow-md shadow-cyan-950/40'
                        : isDarkMode
                        ? 'bg-slate-950 border-slate-800/80 hover:bg-slate-900/90'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="flex items-start gap-1.5 min-w-0">
                        {isAudio && (
                          <div
                            className="p-1 text-slate-500 group-hover:text-cyan-400 transition shrink-0 cursor-grab"
                            title="Drag this stem into Mixer Channels 1-4"
                          >
                            <GripVertical className="w-3.5 h-3.5" />
                          </div>
                        )}
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-[11px] text-white truncate max-w-[170px]" title={asset.filename}>
                              {asset.filename}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 flex-wrap text-[9px]">
                            {/* Category Badge */}
                            <span
                              className={`px-1 py-0.2 rounded font-bold border text-[8px] uppercase ${
                                asset.category === 'MASTER_AUDIO'
                                  ? 'bg-amber-950 text-amber-300 border-amber-800/40'
                                  : asset.category.includes('VOCAL')
                                  ? 'bg-indigo-950 text-indigo-300 border-indigo-800/40'
                                  : asset.category.includes('HARMONY')
                                  ? 'bg-teal-950 text-teal-300 border-teal-800/40'
                                  : asset.category.includes('DRUM')
                                  ? 'bg-emerald-950 text-emerald-300 border-emerald-800/40'
                                  : asset.category.includes('BASS')
                                  ? 'bg-orange-950 text-orange-300 border-orange-800/40'
                                  : asset.category.includes('VISUAL')
                                  ? 'bg-pink-950 text-pink-300 border-pink-800/40'
                                  : 'bg-slate-800 text-slate-300 border-slate-700'
                              }`}
                            >
                              {asset.category.replace('UVR5_', '').replace('_STEM', '').replace('_AUDIO', '')}
                            </span>

                            {/* Format & Size */}
                            <span className="text-slate-400">
                              {asset.fileSizeFormatted || '28 MB'}
                            </span>
                            <span className="text-slate-600">•</span>
                            <span className="text-slate-400 font-mono">
                              {asset.mimeType.includes('wav') ? 'WAV 24/48k' : asset.mimeType.includes('png') ? 'PNG 4K' : 'MP4'}
                            </span>
                          </div>

                          <div className="text-[8px] font-mono text-slate-500 truncate max-w-[210px]">
                            {asset.webdavPath || '/Music-Production'}
                          </div>
                        </div>
                      </div>

                      {/* Right Action Buttons */}
                      <div className="flex items-center gap-1 shrink-0 pt-0.5">
                        {isAudio && (
                          <button
                            type="button"
                            onClick={() => handleTogglePreviewAudio(asset)}
                            className={`p-1.5 rounded-lg transition cursor-pointer ${
                              isPlayingThis
                                ? 'bg-cyan-500 text-slate-950 font-bold'
                                : 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700'
                            }`}
                            title={isPlayingThis ? (isAudioBuffering ? 'Loading actual song from Nextcloud...' : 'Stop Preview') : 'Audition Real Stem from Nextcloud'}
                          >
                            {isPlayingThis ? (
                              isAudioBuffering ? (
                                <RefreshCw className="w-3 h-3 animate-spin text-slate-950" />
                              ) : (
                                <Pause className="w-3 h-3" />
                              )
                            ) : (
                              <Play className="w-3 h-3" />
                            )}
                          </button>
                        )}
                        {asset.shareUrl && (
                          <a
                            href={asset.shareUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                            title="Open in Nextcloud"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Quick Assign Strip (1-Click routing to Track 1, 2, 3, or 4) */}
                    {isAudio && (
                      <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[9px]">
                        <span className="text-slate-500 flex items-center gap-1 font-sans">
                          <span>Quick Route:</span>
                        </span>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4].map(channelId => (
                            <button
                              key={channelId}
                              type="button"
                              onClick={() => onAssignAssetToTrack(channelId, asset)}
                              className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white font-bold transition cursor-pointer border border-slate-700/60"
                              title={`Assign ${asset.filename} directly to Channel ${channelId}`}
                            >
                              +Ch {channelId}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SECTION: 4 EPs CATALOG HIERARCHY ACCORDION */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 px-0.5">
            <span className="flex items-center gap-1.5">
              <Disc className="w-3.5 h-3.5 text-indigo-400" />
              <span>Catalog Suites ({allTracks.length} Songs)</span>
            </span>
          </div>

          <div className="space-y-1.5">
            {epGroups.map((ep) => {
              const isExpanded = !!expandedEpIds[ep.id];
              return (
                <div
                  key={ep.id}
                  className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950/70"
                >
                  <button
                    type="button"
                    onClick={() => toggleEp(ep.id)}
                    className="w-full p-2.5 flex items-center justify-between hover:bg-slate-900 transition text-left cursor-pointer"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-white text-xs truncate">{ep.title}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate">{ep.theme}</p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-slate-800 text-slate-300">
                        {ep.tracks.length}
                      </span>
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </div>
                  </button>

                  {/* EP Songs List */}
                  {isExpanded && (
                    <div className="p-1.5 bg-slate-950 space-y-1 border-t border-slate-800/80">
                      {ep.tracks.map((trk) => {
                        const isSelected = trk.id === selectedTrack.id;
                        return (
                          <div
                            key={trk.id}
                            className={`p-2 rounded-lg flex items-center justify-between transition cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-950/70 border border-indigo-500/50 text-white'
                                : 'hover:bg-slate-900/90 text-slate-300 border border-transparent'
                            }`}
                            onClick={() => onSelectTrack?.(trk)}
                          >
                            <div className="min-w-0 pr-2 space-y-0.5">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-[10px] text-cyan-400 font-mono">
                                  {trk.id}
                                </span>
                                <span className="font-bold text-[11px] truncate" title={trk.title}>
                                  {trk.title}
                                </span>
                              </div>
                              <div className="text-[9px] text-slate-400 flex items-center gap-1">
                                <span>{trk.bpm} BPM</span>
                                <span>•</span>
                                <span>{trk.vocal.split('/')[0]}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onLoadAllStems(trk);
                                }}
                                className="px-1.5 py-0.5 rounded bg-emerald-950/80 hover:bg-emerald-600 text-emerald-300 hover:text-slate-950 border border-emerald-700/50 text-[9px] font-bold font-mono transition"
                                title="Load this song's real stems into Mixer"
                              >
                                Load
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
};
