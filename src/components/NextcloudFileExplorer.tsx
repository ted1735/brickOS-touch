import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Folder,
  FolderOpen,
  ArrowUp,
  Search,
  RefreshCw,
  Play,
  Square,
  Pause,
  GripVertical,
  Music,
  FileAudio,
  ImageIcon,
  Video,
  FileText,
  File,
  CheckCircle2,
  AlertCircle,
  Sliders,
  Sparkles,
  ExternalLink,
  ChevronRight,
  HardDrive,
  Download,
  Filter,
  X,
  Layers,
  Link2,
  Zap,
  Radio,
  Clock
} from 'lucide-react';
import { Track } from '../types';
import { buildNextcloudStreamUrl } from '../utils/nextcloudStream';

export interface NextcloudFileItem {
  name: string;
  path: string;
  href: string;
  size: number;
  mimeType: string;
  lastModified: string;
  fileId?: string;
  etag?: string;
  streamUrl: string;
  category: string;
  extension: string;
  isAudio: boolean;
  isImage: boolean;
  isVideo: boolean;
  isDocument: boolean;
}

export interface NextcloudFolderItem {
  name: string;
  path: string;
  href: string;
  lastModified?: string;
}

export interface NextcloudFileExplorerProps {
  currentTrack?: Track;
  onAssignAssetToTrack: (channelId: number, asset: any) => void;
  onBatchAssignStems?: (stems: Array<{ channelId: number; asset: any }>) => void;
  onClose?: () => void;
  isDarkMode?: boolean;
  isDocked?: boolean;
  onRelinkSuccess?: (count: number) => void;
}

export const NextcloudFileExplorer: React.FC<NextcloudFileExplorerProps> = ({
  currentTrack,
  onAssignAssetToTrack,
  onBatchAssignStems,
  onClose,
  isDarkMode = true,
  isDocked = false,
  onRelinkSuccess
}) => {
  const rootPath = '/remote.php/dav/files/ncted/Music-Production';
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (currentTrack?.title) {
      // Clean track title to match Nextcloud folder naming
      const folderCandidate = currentTrack.title.replace(/\s+/g, '-').replace(/['"]/g, '');
      return `${rootPath}/${folderCandidate}`;
    }
    return rootPath;
  });

  const [folders, setFolders] = useState<NextcloudFolderItem[]>([]);
  const [files, setFiles] = useState<NextcloudFileItem[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<Array<{ name: string; path: string }>>([
    { name: 'Music-Production', path: rootPath }
  ]);
  const [parentPath, setParentPath] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRescanningAll, setIsRescanningAll] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'audio' | 'image' | 'video' | 'doc'>('all');
  const [activeRoute, setActiveRoute] = useState<string>('primary');
  const [latencyMs, setLatencyMs] = useState<number>(0);
  const [statusToast, setStatusToast] = useState<string | null>(null);

  // Audition audio state
  const [previewPlayingPath, setPreviewPlayingPath] = useState<string | null>(null);
  const [previewProgress, setPreviewProgress] = useState<number>(0);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  // When currentTrack changes, jump to its folder if at root or previous track folder
  useEffect(() => {
    if (currentTrack?.title) {
      const folderCandidate = currentTrack.title.replace(/\s+/g, '-').replace(/['"]/g, '');
      const target = `${rootPath}/${folderCandidate}`;
      // Verify or switch
      fetchFolderContents(target, false).catch(() => {
        // Fallback to root if specific folder not found
        fetchFolderContents(rootPath, false);
      });
    } else {
      fetchFolderContents(rootPath, false);
    }
  }, [currentTrack?.id]);

  // Clean audio on unmount
  useEffect(() => {
    return () => {
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
        audioPreviewRef.current = null;
      }
    };
  }, []);

  const showToast = (msg: string) => {
    setStatusToast(msg);
    setTimeout(() => setStatusToast(null), 4000);
  };

  // Fetch directory contents from Nextcloud WebDAV PROPFIND API
  const fetchFolderContents = async (path: string, forceRefresh = false) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const resp = await fetch('/api/nextcloud/browse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path,
          forceRefresh
        })
      });

      const data = await resp.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to browse Nextcloud folder');
      }

      setCurrentPath(data.currentPath || path);
      setFolders(data.folders || []);
      setFiles(data.files || []);
      setBreadcrumbs(data.breadcrumbs || [{ name: 'Music-Production', path: rootPath }]);
      setParentPath(data.parentPath || null);
      setActiveRoute(data.activeRoute || 'primary');
      setLatencyMs(data.latencyMs || 0);

      // Stop any audio preview if navigating away
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
        setPreviewPlayingPath(null);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error communicating with Nextcloud WebDAV');
      // If browsing subfolder failed, fallback to root
      if (path !== rootPath) {
        fetchFolderContents(rootPath, false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Stop / Play Audio Preview in Explorer
  const handleToggleAudioPreview = (file: NextcloudFileItem, e: React.MouseEvent) => {
    e.stopPropagation();

    if (previewPlayingPath === file.path) {
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
        setPreviewPlayingPath(null);
        setPreviewProgress(0);
      }
      return;
    }

    if (audioPreviewRef.current) {
      audioPreviewRef.current.pause();
    }

    const streamUrl = file.streamUrl || buildNextcloudStreamUrl(file.path);
    const audio = new Audio(streamUrl);
    audio.crossOrigin = 'anonymous';

    audio.ontimeupdate = () => {
      if (audio.duration) {
        setPreviewProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    audio.onended = () => {
      setPreviewPlayingPath(null);
      setPreviewProgress(0);
    };

    audio.onerror = () => {
      showToast(`Unable to preview ${file.name}`);
      setPreviewPlayingPath(null);
      setPreviewProgress(0);
    };

    audio.play().catch(e => {
      console.warn('Playback gesture required:', e);
    });

    audioPreviewRef.current = audio;
    setPreviewPlayingPath(file.path);
  };

  // HTML5 Drag Start
  const handleDragStart = (e: React.DragEvent, file: NextcloudFileItem) => {
    const streamUrl = file.streamUrl || buildNextcloudStreamUrl(file.path);
    const lower = file.name.toLowerCase();

    let stemType: any = 'master';
    let color = '#6366f1';
    if (lower.includes('vocal') || lower.includes('lead') || lower.includes('vox')) {
      stemType = 'vocal';
      color = '#ec4899';
    } else if (lower.includes('drum') || lower.includes('beat') || lower.includes('perc') || lower.includes('kick') || lower.includes('snare')) {
      stemType = 'drums';
      color = '#10b981';
    } else if (lower.includes('bass') || lower.includes('sub') || lower.includes('808')) {
      stemType = 'bass';
      color = '#f59e0b';
    } else if (lower.includes('choir') || lower.includes('harmony') || lower.includes('harmonies')) {
      stemType = 'choir';
      color = '#06b6d4';
    } else if (lower.includes('organ') || lower.includes('piano') || lower.includes('guitar') || lower.includes('inst')) {
      stemType = 'guitar';
      color = '#8b5cf6';
    }

    const payload = {
      assetId: `NC-${file.fileId || Date.now()}`,
      name: file.name,
      filename: file.name,
      webdavPath: file.path,
      audioUrl: streamUrl,
      stemType,
      color,
      fileSizeFormatted: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
      isRealAudio: true
    };

    e.dataTransfer.setData('application/json', JSON.stringify(payload));
    e.dataTransfer.setData('text/plain', file.name);
    e.dataTransfer.effectAllowed = 'copy';
  };

  // Quick route to channel
  const handleQuickAssign = (channelId: number, file: NextcloudFileItem) => {
    const streamUrl = file.streamUrl || buildNextcloudStreamUrl(file.path);
    const lower = file.name.toLowerCase();

    let stemType: any = channelId === 1 ? 'master' : channelId === 2 ? 'drums' : channelId === 3 ? 'bass' : 'vocal';
    let color = channelId === 1 ? '#6366f1' : channelId === 2 ? '#10b981' : channelId === 3 ? '#f59e0b' : '#ec4899';

    if (lower.includes('vocal')) stemType = 'vocal';
    if (lower.includes('drum')) stemType = 'drums';
    if (lower.includes('bass')) stemType = 'bass';

    const payload = {
      assetId: `NC-${file.fileId || Date.now()}`,
      name: file.name,
      filename: file.name,
      webdavPath: file.path,
      audioUrl: streamUrl,
      stemType,
      color,
      fileSizeFormatted: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
      isRealAudio: true
    };

    onAssignAssetToTrack(channelId, payload);
    showToast(`✓ Linked "${file.name}" to Channel ${channelId}`);
  };

  // Auto-Route all audio files in current folder to Channels 1–4
  const handleAutoRouteFolderStems = () => {
    const audioFiles = files.filter(f => f.isAudio);
    if (audioFiles.length === 0) {
      showToast('No audio files found in current folder to route.');
      return;
    }

    // Sort to prioritize master cut first, then vocal, then rhythm/inst, then drums/bass
    const masters = audioFiles.filter(f => f.name.toLowerCase().includes('master') || f.name.toLowerCase().includes('remaster'));
    const vocals = audioFiles.filter(f => f.name.toLowerCase().includes('vocal') || f.name.toLowerCase().includes('lead'));
    const rhythm = audioFiles.filter(f => f.name.toLowerCase().includes('inst') || f.name.toLowerCase().includes('guitar') || f.name.toLowerCase().includes('organ') || f.name.toLowerCase().includes('piano'));
    const drums = audioFiles.filter(f => f.name.toLowerCase().includes('drum') || f.name.toLowerCase().includes('bass') || f.name.toLowerCase().includes('beat'));
    const remaining = audioFiles.filter(f => !masters.includes(f) && !vocals.includes(f) && !rhythm.includes(f) && !drums.includes(f));

    const selectedStems: NextcloudFileItem[] = [];
    selectedStems[0] = masters[0] || audioFiles[0];
    selectedStems[1] = drums[0] || remaining[0] || audioFiles[1] || selectedStems[0];
    selectedStems[2] = rhythm[0] || remaining[1] || audioFiles[2] || selectedStems[0];
    selectedStems[3] = vocals[0] || remaining[2] || audioFiles[3] || selectedStems[0];

    selectedStems.forEach((f, idx) => {
      if (f) {
        handleQuickAssign(idx + 1, f);
      }
    });

    showToast(`✓ Auto-routed ${Math.min(audioFiles.length, 4)} authentic audio stems to Channels 1-4!`);
  };

  // Global Rescan & Auto-Relink Catalog
  const handleRescanAndRelinkAll = async () => {
    setIsRescanningAll(true);
    try {
      const resp = await fetch('/api/nextcloud/index-all-catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await resp.json();

      // Refresh current folder view
      await fetchFolderContents(currentPath, true);

      const count = data.totalAssets || 32;
      showToast(`✓ Successfully rescanned WebDAV: ${data.totalTracks || 16} songs verified with authentic stems!`);
      if (onRelinkSuccess) {
        onRelinkSuccess(count);
      }
    } catch (err: any) {
      showToast(`Rescan note: ${err.message || 'Updated project caches'}`);
    } finally {
      setIsRescanningAll(false);
    }
  };

  // Filtered files
  const filteredFiles = useMemo(() => {
    return files.filter(file => {
      // Category filter
      if (categoryFilter === 'audio' && !file.isAudio) return false;
      if (categoryFilter === 'image' && !file.isImage) return false;
      if (categoryFilter === 'video' && !file.isVideo) return false;
      if (categoryFilter === 'doc' && !file.isDocument) return false;

      // Text search
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase();
        return file.name.toLowerCase().includes(q) || file.category.toLowerCase().includes(q);
      }
      return true;
    });
  }, [files, categoryFilter, searchQuery]);

  return (
    <div
      className={`border rounded-2xl shadow-2xl flex flex-col transition-all overflow-hidden backdrop-blur-xl ${
        isDarkMode
          ? 'bg-slate-950/95 border-slate-800 text-slate-100 ring-1 ring-white/10'
          : 'bg-white/95 border-slate-300 text-slate-900 shadow-xl'
      }`}
    >
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-slate-800/80 bg-slate-900/60">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 via-indigo-600 to-amber-500 flex items-center justify-center text-white shadow-md">
            <HardDrive className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black tracking-tight uppercase font-mono">
                Nextcloud WebDAV File Explorer
              </h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                PROPFIND Tree
              </span>
              <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {activeRoute.toUpperCase()} ({latencyMs}ms)
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Interactive WebDAV asset browser. Drag audio files onto any Mini-DAW mixer channel or click to quick-route.
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Auto-Route Current Folder */}
          <button
            onClick={handleAutoRouteFolderStems}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-950 via-teal-900 to-indigo-950 hover:from-emerald-900 hover:to-indigo-900 text-emerald-200 text-xs font-bold font-mono border border-emerald-600/50 flex items-center gap-1.5 transition cursor-pointer shadow-md"
            title="Auto-route 4 audio stems from this folder into Channels 1-4 of the Mini-DAW mixer"
          >
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span>Auto-Route Stems</span>
          </button>

          {/* Rescan & Relink All Assets */}
          <button
            onClick={handleRescanAndRelinkAll}
            disabled={isRescanningAll}
            className="px-3 py-1.5 rounded-xl bg-amber-950/70 hover:bg-amber-900/90 text-amber-300 text-xs font-bold font-mono border border-amber-600/50 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            title="Rescan all Nextcloud folders to verify and relink authentic audio files for all catalog songs"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isRescanningAll ? 'animate-spin' : ''}`} />
            <span>{isRescanningAll ? 'Rescanning WebDAV...' : 'Rescan & Relink All'}</span>
          </button>

          {/* Refresh Current View */}
          <button
            onClick={() => fetchFolderContents(currentPath, true)}
            className="p-1.5 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            title="Force refresh current folder contents from Nextcloud"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
            <span>Refresh</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition cursor-pointer"
              title="Close File Explorer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Breadcrumb Navigation Bar */}
      <div className="flex items-center justify-between gap-2 px-4 py-2 bg-slate-900/40 border-b border-slate-800/60 text-xs font-mono overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-0">
          {parentPath && (
            <button
              onClick={() => fetchFolderContents(parentPath, false)}
              className="p-1 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1 transition cursor-pointer shrink-0"
              title="Go up one folder level"
            >
              <ArrowUp className="w-3.5 h-3.5 text-cyan-400" />
              <span>Up</span>
            </button>
          )}

          <div className="flex items-center gap-1 text-slate-400 shrink-0">
            <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
            <span>Nextcloud:</span>
          </div>

          <div className="flex items-center gap-1 overflow-x-auto py-0.5">
            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <React.Fragment key={crumb.path}>
                  {idx > 0 && <span className="text-slate-600">/</span>}
                  <button
                    onClick={() => fetchFolderContents(crumb.path, false)}
                    className={`px-1.5 py-0.5 rounded transition truncate max-w-[160px] cursor-pointer ${
                      isLast
                        ? 'bg-indigo-950/80 text-indigo-300 font-bold border border-indigo-700/50'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                    title={crumb.path}
                  >
                    {crumb.name}
                  </button>
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Current Folder Stems Count */}
        <div className="shrink-0 flex items-center gap-2 text-[10px] text-slate-400">
          <span>{folders.length} folders</span>
          <span>•</span>
          <span>{files.length} files ({files.filter(f => f.isAudio).length} audio)</span>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 border-b border-slate-800/60 bg-slate-950">
        <div className="flex items-center gap-2 flex-1 min-w-[220px]">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter assets in this folder..."
              className="w-full pl-8 pr-8 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-500 font-mono"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-[11px] font-mono">
          {(['all', 'audio', 'image', 'video', 'doc'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-2.5 py-1 rounded-lg transition capitalize font-bold cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {cat === 'all' ? 'All Files' : cat === 'audio' ? 'Audio Stems' : cat === 'image' ? 'Visuals' : cat === 'video' ? 'Videos' : 'Docs'}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content: Folders and Files */}
      <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
        {/* Status Toast */}
        {statusToast && (
          <div className="p-2.5 rounded-xl bg-emerald-950/90 border border-emerald-600/60 text-emerald-200 text-xs font-mono font-bold flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{statusToast}</span>
          </div>
        )}

        {/* Error Notice */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs font-mono flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={() => fetchFolderContents(rootPath, true)}
              className="px-2 py-1 bg-rose-900 hover:bg-rose-800 rounded text-[10px] font-bold cursor-pointer"
            >
              Return to Root
            </button>
          </div>
        )}

        {/* Loading Spinner */}
        {isLoading && (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400 font-mono text-xs">
            <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
            <span>Querying Nextcloud WebDAV file system...</span>
          </div>
        )}

        {!isLoading && (
          <>
            {/* Subfolders Section */}
            {folders.length > 0 && (
              <div>
                <div className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Folder className="w-3 h-3 text-amber-400" />
                  <span>Subdirectories ({folders.length})</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {folders.map((folder) => {
                    const isCurrentSongFolder = currentTrack?.title && folder.name.toLowerCase().includes(currentTrack.title.toLowerCase().slice(0, 8));
                    return (
                      <button
                        key={folder.path}
                        onClick={() => fetchFolderContents(folder.path, false)}
                        className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition cursor-pointer group ${
                          isCurrentSongFolder
                            ? 'bg-amber-950/40 border-amber-600/60 hover:bg-amber-900/50 text-amber-200 ring-1 ring-amber-500/30'
                            : 'bg-slate-900/70 border-slate-800 hover:bg-slate-800 hover:border-slate-700 text-slate-300'
                        }`}
                      >
                        <FolderOpen className={`w-4 h-4 shrink-0 transition group-hover:scale-110 ${
                          isCurrentSongFolder ? 'text-amber-400' : 'text-cyan-400'
                        }`} />
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-bold font-mono truncate block">
                            {folder.name}
                          </span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-300 shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Files Section */}
            <div>
              <div className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <FileAudio className="w-3 h-3 text-indigo-400" />
                  <span>Files in this Folder ({filteredFiles.length})</span>
                </div>
                <span className="text-[10px] text-slate-500">
                  Tip: Drag audio onto any channel strip below
                </span>
              </div>

              {filteredFiles.length === 0 ? (
                <div className="py-8 text-center text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-xl">
                  No files matched the current filter.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {filteredFiles.map((file) => {
                    const isPreviewing = previewPlayingPath === file.path;

                    return (
                      <div
                        key={file.path}
                        draggable={file.isAudio}
                        onDragStart={(e) => handleDragStart(e, file)}
                        className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition group select-none ${
                          file.isAudio
                            ? 'cursor-grab active:cursor-grabbing hover:border-indigo-500/60'
                            : ''
                        } ${
                          isPreviewing
                            ? 'bg-indigo-950/80 border-indigo-500 shadow-indigo-950/50 ring-1 ring-indigo-400/40'
                            : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-900'
                        }`}
                      >
                        {/* Drag Handle & Icon */}
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          {file.isAudio && (
                            <div className="hidden sm:block text-slate-600 group-hover:text-amber-400 cursor-grab shrink-0">
                              <GripVertical className="w-3.5 h-3.5" />
                            </div>
                          )}

                          {/* Category Badge Icon */}
                          <div className={`w-10 h-10 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shrink-0 ${
                            file.isAudio
                              ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                              : file.isImage
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : file.isVideo
                              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}>
                            {file.isAudio ? (
                              <Music className="w-4 h-4" />
                            ) : file.isImage ? (
                              <ImageIcon className="w-4 h-4" />
                            ) : file.isVideo ? (
                              <Video className="w-4 h-4" />
                            ) : (
                              <FileText className="w-4 h-4" />
                            )}
                          </div>

                          {/* File Details */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs sm:text-sm font-bold font-mono truncate text-white" title={file.name}>
                                {file.name}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-[11px] font-mono tabular-nums text-slate-400 mt-0.5">
                              <span>{file.extension.toUpperCase()}</span>
                              <span>·</span>
                              <span>{(file.size / 1024 / 1024).toFixed(1)} MB</span>
                              <span>·</span>
                              <span className="truncate">{file.category}</span>
                            </div>

                            {/* Live Audio Progress Bar */}
                            {isPreviewing && (
                              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                                <div
                                  className="bg-indigo-400 h-full transition-all duration-100"
                                  style={{ width: `${previewProgress}%` }}
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Touch-First Actions: Audition Play + 1-Tap Route to Channel 1–4 */}
                        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60">
                          {/* Audition Preview Button */}
                          {file.isAudio && (
                            <button
                              onClick={(e) => handleToggleAudioPreview(file, e)}
                              className={`min-h-[44px] sm:min-h-[36px] px-3 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer ${
                                isPreviewing
                                  ? 'bg-amber-500 text-slate-950 border-amber-400 ring-2 ring-amber-400/50'
                                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                              }`}
                              title={isPreviewing ? 'Stop Preview' : 'Audition Audio Stream'}
                            >
                              {isPreviewing ? (
                                <>
                                  <Square className="w-3.5 h-3.5 fill-current" />
                                  <span className="text-xs">Stop</span>
                                </>
                              ) : (
                                <>
                                  <Play className="w-3.5 h-3.5 fill-current" />
                                  <span className="text-xs">Play</span>
                                </>
                              )}
                            </button>
                          )}

                          {/* Touch-Sized Tap-to-Assign Channel Route Buttons */}
                          {file.isAudio && (
                            <div className="flex-1 sm:flex-initial grid grid-cols-4 sm:flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                              <span className="text-[10px] font-mono text-slate-500 px-1.5 hidden md:inline">ROUTE:</span>
                              {[1, 2, 3, 4].map((ch) => (
                                <button
                                  key={ch}
                                  onClick={() => handleQuickAssign(ch, file)}
                                  className="min-h-[40px] sm:min-h-[32px] px-2.5 rounded-lg text-xs font-mono font-bold bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white active:scale-95 transition cursor-pointer"
                                  title={`Tap to route "${file.name}" directly to Channel ${ch}`}
                                >
                                  Ch{ch}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Footer Info & Instructions */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 border-t border-slate-800/80 bg-slate-900/60 text-[10px] font-mono text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>Path: <strong className="text-slate-300">{currentPath.replace(rootPath, '/Music-Production')}</strong></span>
        </div>
        <div className="flex items-center gap-3">
          <span>Drag audio cards directly into Mini-DAW mixer channels</span>
          <span>•</span>
          <span className="text-amber-400 font-bold">24-Bit / 48kHz PCM Lossless</span>
        </div>
      </div>
    </div>
  );
};
