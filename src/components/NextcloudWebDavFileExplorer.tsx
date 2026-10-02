import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Folder,
  FolderPlus,
  File,
  Music,
  FileText,
  Image as ImageIcon,
  Video,
  Play,
  Pause,
  Upload,
  RefreshCw,
  Search,
  ArrowUp,
  ChevronRight,
  MoreVertical,
  Trash2,
  Edit2,
  ExternalLink,
  Download,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Copy,
  LayoutGrid,
  List,
  Volume2,
  VolumeX,
  Repeat,
  Radio,
  Sparkles,
  Layers,
  ArrowRight,
  Eye,
  X,
  FileCode,
  HardDrive,
  Disc,
  Link as LinkIcon,
  Tag,
  CornerDownRight,
  ShieldCheck,
  Key,
  Zap,
  Activity
} from 'lucide-react';
import { Track, WebDavFolderItem, WebDavFileItem, WebDavBreadcrumb, WebDavBrowseResponse } from '../types';
import { CANONICAL_TRACKS } from '../data/canonicalCatalog';
import { getSavedNextcloudConfig } from '../data/nextcloudFolderAssets';
import { audioMiniDaw } from '../utils/audioEngine';
import { TailscaleVpnModal } from './TailscaleVpnModal';

interface NextcloudWebDavFileExplorerProps {
  tracks?: Track[];
  selectedTrack?: Track;
  onSelectTrack?: (track: Track) => void;
  onSendToMixer?: (file: WebDavFileItem, channelIndex: number) => void;
  isDarkMode?: boolean;
  initialPath?: string;
  className?: string;
  onClose?: () => void;
}

export const NextcloudWebDavFileExplorer: React.FC<NextcloudWebDavFileExplorerProps> = ({
  tracks = CANONICAL_TRACKS,
  selectedTrack,
  onSelectTrack,
  onSendToMixer,
  isDarkMode = true,
  initialPath = '/remote.php/dav/files/ncted/Music-Production',
  className = '',
  onClose
}) => {
  // Navigation & Directory State
  const [currentPath, setCurrentPath] = useState<string>(initialPath);
  const [parentPath, setParentPath] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<WebDavBreadcrumb[]>([]);
  const [folders, setFolders] = useState<WebDavFolderItem[]>([]);
  const [files, setFiles] = useState<WebDavFileItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [latencyMs, setLatencyMs] = useState<number>(0);
  const [isAuthRequired, setIsAuthRequired] = useState<boolean>(false);

  // View & Filter Options
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterType, setFilterType] = useState<'ALL' | 'AUDIO' | 'STEMS' | 'VISUALS' | 'VIDEOS' | 'DOCS'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'date' | 'type'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Audio Audition Player State
  const [activeAudio, setActiveAudio] = useState<WebDavFileItem | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isLooping, setIsLooping] = useState<boolean>(false);
  const [audioLoading, setAudioLoading] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Dialog & Modal State
  const [isNewFolderOpen, setIsNewFolderOpen] = useState<boolean>(false);
  const [newFolderName, setNewFolderName] = useState<string>('');
  const [isCreatingFolder, setIsCreatingFolder] = useState<boolean>(false);

  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [renameTarget, setRenameTarget] = useState<{ path: string; name: string; isFolder: boolean } | null>(null);
  const [renameInput, setRenameInput] = useState<string>('');
  const [isRenaming, setIsRenaming] = useState<boolean>(false);

  const [deleteTarget, setDeleteTarget] = useState<{ path: string; name: string; isFolder: boolean } | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const [previewFile, setPreviewFile] = useState<WebDavFileItem | null>(null);
  const [previewContent, setPreviewContent] = useState<string>('');
  const [isLoadingPreview, setIsLoadingPreview] = useState<boolean>(false);
  const [isTailscaleModalOpen, setIsTailscaleModalOpen] = useState<boolean>(false);

  // Multi-Route Redundancy & Ultra-Highspeed State
  const [activeRoute, setActiveRoute] = useState<'primary' | 'fallback'>('primary');
  const [isFromCache, setIsFromCache] = useState<boolean>(false);
  const [isPushConnected, setIsPushConnected] = useState<boolean>(false);
  const [routeStats, setRouteStats] = useState<any>(null);
  const [isSwitchingRoute, setIsSwitchingRoute] = useState<boolean>(false);
  const currentPathRef = useRef<string>(currentPath);

  const [toastMessage, setToastMessage] = useState<string>('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const fetchRouteStatus = async () => {
    try {
      const res = await fetch('/api/nextcloud/routes');
      if (res.ok) {
        const d = await res.json();
        setRouteStats(d);
        if (d.activeRoute) setActiveRoute(d.activeRoute);
        setIsPushConnected(Boolean(d.pushWebSocket?.connected));
      }
    } catch {
      // ignore
    }
  };

  // Fetch directory contents via WebDAV PROPFIND API with in-memory RAM caching and failover
  const fetchDirectory = async (targetPath: string, silent = false, forceRefresh = false) => {
    if (!silent) setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await fetch('/api/nextcloud/browse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: targetPath, forceRefresh })
      });

      const data: any = await res.json();

      if (!res.ok || !data.success) {
        if (res.status === 401 || data.isAuthRequired) {
          setIsAuthRequired(true);
          setErrorMessage('Nextcloud authentication required. Please verify your App Password in Settings.');
        } else {
          setErrorMessage(data.message || 'Failed to browse Nextcloud WebDAV directory');
        }
        return;
      }

      setIsAuthRequired(false);
      setCurrentPath(data.currentPath);
      currentPathRef.current = data.currentPath;
      setParentPath(data.parentPath);
      setBreadcrumbs(data.breadcrumbs || []);
      setFolders(data.folders || []);
      setFiles(data.files || []);
      setLatencyMs(data.latencyMs || 0);
      setIsFromCache(Boolean(data.isFromCache));
      if (data.activeRoute) setActiveRoute(data.activeRoute);
    } catch (err: any) {
      console.error('Error fetching Nextcloud directory:', err);
      if (!silent) setErrorMessage(err.message || 'Network error connecting to Nextcloud WebDAV');
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  // Manually purge RAM PROPFIND Cache
  const handlePurgeCache = async () => {
    try {
      await fetch('/api/nextcloud/purge-cache', { method: 'POST' });
      showToast('⚡ In-Memory RAM Cache Purged — Fetching Fresh Nextcloud Data');
      fetchDirectory(currentPath, false, true);
    } catch {
      showToast('Failed to purge cache');
    }
  };

  // Manually toggle or test failover route
  const handleToggleRoute = async () => {
    setIsSwitchingRoute(true);
    const targetRoute = activeRoute === 'primary' ? 'fallback' : 'primary';
    try {
      const res = await fetch('/api/nextcloud/switch-route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ route: targetRoute })
      });
      const data = await res.json();
      if (data.success) {
        setActiveRoute(targetRoute);
        showToast(`Route switched to ${targetRoute === 'primary' ? 'Tailscale Direct (1 Gbps)' : 'Cloudflare Fallback'}`);
        fetchDirectory(currentPath, false, true);
      }
    } catch {
      showToast('Failed to switch route');
    } finally {
      setIsSwitchingRoute(false);
    }
  };

  // Initial load & real-time SSE listener from Rust notify_push
  useEffect(() => {
    fetchDirectory(currentPath);
    fetchRouteStatus();

    // Subscribe to Server-Sent Events (SSE) from notify_push
    let es: EventSource | null = null;
    try {
      es = new EventSource('/api/nextcloud/events');
      es.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload?.type === 'push_file_change' || payload?.type === 'cache_invalidated') {
            // Live file change occurred on Nextcloud! Silently refresh folder
            fetchDirectory(currentPathRef.current, true, true);
            showToast('⚡ Live Sync: notify_push detected file change — refreshed');
          } else if (payload?.type === 'push_connected') {
            setIsPushConnected(true);
          } else if (payload?.type === 'init') {
            setIsPushConnected(Boolean(payload.pushWebSocketConnected));
            if (payload.activeRoute) setActiveRoute(payload.activeRoute);
          }
        } catch {
          // ignore
        }
      };
    } catch (err) {
      console.warn('SSE event connection failed:', err);
    }

    const interval = setInterval(fetchRouteStatus, 15000);

    return () => {
      es?.close();
      clearInterval(interval);
    };
  }, []);

  // Audio Playback Transport Management
  const handleTogglePlay = (file: WebDavFileItem) => {
    if (activeAudio?.path === file.path) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        audioRef.current?.play().then(() => setIsPlaying(true)).catch(err => {
          console.warn('Playback error:', err);
          showToast('Audio playback could not be started');
        });
      }
      return;
    }

    // Switch to new audio file
    setActiveAudio(file);
    setIsPlaying(false);
    setAudioLoading(true);
    setCurrentTime(0);

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = file.streamUrl;
      audioRef.current.load();
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
          setAudioLoading(false);
        })
        .catch(err => {
          console.warn('Playback trigger error:', err);
          setAudioLoading(false);
          showToast(`Audition started for ${file.name}`);
        });
    }
  };

  const handleAudioTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleSeek = (newTime: number) => {
    if (audioRef.current && isFinite(newTime)) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : newVol;
    }
  };

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (audioRef.current) {
      audioRef.current.volume = nextMuted ? 0 : volume;
    }
  };

  // Directory Navigation Handlers
  const handleNavigateToFolder = (folderPath: string) => {
    fetchDirectory(folderPath);
  };

  const handleNavigateUp = () => {
    if (parentPath) {
      fetchDirectory(parentPath);
    }
  };

  // Folder Creation Handler
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    setIsCreatingFolder(true);
    try {
      const res = await fetch('/api/nextcloud/create-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentPath: currentPath,
          folderName: newFolderName.trim()
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Created folder "${newFolderName.trim()}"`);
        setIsNewFolderOpen(false);
        setNewFolderName('');
        fetchDirectory(currentPath);
      } else {
        showToast(data.message || data.error || 'Failed to create folder');
      }
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    } finally {
      setIsCreatingFolder(false);
    }
  };

  // Delete Item Handler
  const handleDeleteItem = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      const res = await fetch('/api/nextcloud/delete-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: deleteTarget.path })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Deleted ${deleteTarget.isFolder ? 'folder' : 'file'} "${deleteTarget.name}"`);
        setDeleteTarget(null);
        fetchDirectory(currentPath);
      } else {
        showToast(data.message || data.error || 'Deletion failed');
      }
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Rename / Move Item Handler
  const handleRenameItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameTarget || !renameInput.trim()) return;

    setIsRenaming(true);
    const parent = renameTarget.path.split('/').slice(0, -1).join('/');
    const destinationPath = `${parent}/${renameInput.trim()}`;

    try {
      const res = await fetch('/api/nextcloud/move-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourcePath: renameTarget.path,
          destinationPath,
          overwrite: false
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Renamed to "${renameInput.trim()}"`);
        setRenameTarget(null);
        setRenameInput('');
        fetchDirectory(currentPath);
      } else {
        showToast(data.message || data.error || 'Rename failed');
      }
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    } finally {
      setIsRenaming(false);
    }
  };

  // File Upload Handler (Base64 WebDAV PUT)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress(`Uploading ${uploadedFiles.length} file(s)...`);

    try {
      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];
        setUploadProgress(`Uploading ${i + 1}/${uploadedFiles.length}: ${file.name}...`);

        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            // Strip data:mime/type;base64, prefix
            const base64 = result.includes(',') ? result.split(',')[1] : result;
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const targetFilePath = `${currentPath.replace(/\/+$/, '')}/${file.name}`;

        const res = await fetch('/api/nextcloud/upload-file', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filePath: targetFilePath,
            base64Data,
            contentType: file.type || 'application/octet-stream'
          })
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || `Failed to upload ${file.name}`);
        }
      }

      showToast(`Successfully uploaded ${uploadedFiles.length} file(s) to Nextcloud!`);
      setIsUploadOpen(false);
      fetchDirectory(currentPath);
    } catch (err: any) {
      showToast(`Upload error: ${err.message}`);
    } finally {
      setIsUploading(false);
      setUploadProgress('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Preview File Handler (Text/Markdown reader)
  const handleOpenPreview = async (file: WebDavFileItem) => {
    setPreviewFile(file);
    if (file.isDocument) {
      setIsLoadingPreview(true);
      try {
        const res = await fetch(file.streamUrl);
        const text = await res.text();
        setPreviewContent(text);
      } catch (err: any) {
        setPreviewContent('Failed to load text content.');
      } finally {
        setIsLoadingPreview(false);
      }
    } else {
      setPreviewContent('');
    }
  };

  // Format Helpers
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatSeconds = (sec: number): string => {
    if (!sec || isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Filtered & Sorted Lists
  const filteredFolders = useMemo(() => {
    return folders.filter(f => {
      if (!searchQuery) return true;
      return f.name.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [folders, searchQuery]);

  const filteredFiles = useMemo(() => {
    return files.filter(f => {
      // Type Filter
      if (filterType === 'AUDIO' && !f.isAudio) return false;
      if (filterType === 'STEMS' && (!f.isAudio || (!f.name.toLowerCase().includes('stem') && !f.path.toLowerCase().includes('stem') && !f.name.toLowerCase().includes('vox') && !f.name.toLowerCase().includes('drum') && !f.name.toLowerCase().includes('bass')))) return false;
      if (filterType === 'VISUALS' && !f.isImage) return false;
      if (filterType === 'VIDEOS' && !f.isVideo) return false;
      if (filterType === 'DOCS' && !f.isDocument) return false;

      // Search Query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return f.name.toLowerCase().includes(q) || f.category.toLowerCase().includes(q);
      }
      return true;
    }).sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortBy === 'size') cmp = a.size - b.size;
      else if (sortBy === 'date') cmp = new Date(a.lastModified).getTime() - new Date(b.lastModified).getTime();
      else if (sortBy === 'type') cmp = a.category.localeCompare(b.category);
      return sortOrder === 'asc' ? cmp : -cmp;
    });
  }, [files, filterType, searchQuery, sortBy, sortOrder]);

  // Detected Song Projects from root folders
  const songProjectShortcuts = useMemo(() => {
    const knownNames = [
      { name: 'Meet_Me_Here', trackId: 'TRK-01', title: 'Meet Me Here' },
      { name: 'Brick-by-Brick', trackId: 'TRK-02', title: 'Brick by Brick' },
      { name: 'Every-Candles-Victory', trackId: 'TRK-03', title: 'Every Candle\'s Victory' },
      { name: 'Breath-and-Bone', trackId: 'TRK-04', title: 'Breath and Bone' },
      { name: 'Calvary-Grit', trackId: 'TRK-05', title: 'Calvary Grit' },
      { name: 'Blindfold-Blessing', trackId: 'TRK-06', title: 'Blindfold Blessing' },
      { name: 'In-Our-Veins', trackId: 'TRK-07', title: 'In Our Veins' },
      { name: 'We-Bow-We-Shout', trackId: 'TRK-08', title: 'We Bow We Shout' },
      { name: 'The-Anchor', trackId: 'TRK-09', title: 'The Anchor' },
      { name: 'The-Masters-Hand', trackId: 'TRK-10', title: 'The Master\'s Hand' },
      { name: 'Through-the-Valley-Or-the-Flame', trackId: 'TRK-11', title: 'Through the Valley' },
      { name: 'The-Final-Say', trackId: 'TRK-12', title: 'The Final Say' },
      { name: 'Trading-In-The-Mask', trackId: 'TRK-13', title: 'Trading In The Mask' },
      { name: 'Venom-into-Victory', trackId: 'TRK-14', title: 'Venom into Victory' },
      { name: 'Unity-In-The-Friction', trackId: 'TRK-15', title: 'Unity In The Friction' },
      { name: 'Triumph-in-Your-Name', trackId: 'TRK-16', title: 'Triumph in Your Name' },
      { name: '00-Active_Projects', trackId: 'ACTIVE', title: 'Active Stems & Mixes' }
    ];
    return knownNames;
  }, []);

  return (
    <div className={`flex flex-col h-full rounded-2xl border transition-all overflow-hidden ${
      isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'
    } ${className}`}>

      {/* Hidden Audio Element for Auditions */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleAudioTimeUpdate}
        onEnded={() => {
          if (!isLooping) setIsPlaying(false);
        }}
        loop={isLooping}
        preload="auto"
      />

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-24 right-6 z-50 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-2xl flex items-center gap-2 border border-indigo-400 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* EXPLORER TOP HEADER BAR */}
      <div className={`p-4 border-b flex flex-wrap items-center justify-between gap-3 ${
        isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-2xs'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-cyan-950/40">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black tracking-wide uppercase">Nextcloud WebDAV Explorer</h2>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live WebDAV
              </span>
              {latencyMs > 0 && (
                <span className="text-[10px] font-mono text-slate-400">
                  {latencyMs}ms
                </span>
              )}
            </div>
            <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Browse, audition, and organize linear PCM 24-bit/48kHz WAV audio stems, visuals & lyric sheets on your Nextcloud server
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => fetchDirectory(currentPath)}
            disabled={isLoading}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition cursor-pointer ${
              isDarkMode
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
            }`}
            title="Refresh Directory (PROPFIND)"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={() => setIsNewFolderOpen(true)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition cursor-pointer ${
              isDarkMode
                ? 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border-slate-700'
                : 'bg-slate-100 hover:bg-slate-200 text-cyan-700 border-slate-300'
            }`}
            title="Create New Folder on WebDAV (MKCOL)"
          >
            <FolderPlus className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">New Folder</span>
          </button>

          <button
            onClick={() => setIsUploadOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-950/40 transition border border-indigo-400/30 cursor-pointer"
            title="Upload Audio or Visual Assets to Current Directory"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload</span>
          </button>

          <button
            type="button"
            onClick={() => setIsTailscaleModalOpen(true)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition cursor-pointer ${
              isDarkMode
                ? 'bg-teal-950/40 hover:bg-teal-900/60 text-teal-300 border-teal-700/50 shadow-xs'
                : 'bg-teal-50 hover:bg-teal-100 text-teal-800 border-teal-300'
            }`}
            title="Tailscale Mesh VPN Manager — Connect private Nextcloud node"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
            <span className="hidden sm:inline">Tailscale VPN</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className={`p-1.5 rounded-xl border text-slate-400 hover:text-white transition ${
                isDarkMode ? 'border-slate-800 hover:bg-slate-800' : 'border-slate-300 hover:bg-slate-100'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ULTRA-HIGHSPEED MULTI-ROUTE & SERVER-SIDE OPTIMIZATIONS STATUS RIBBON */}
      <div className={`px-4 py-2 border-b flex items-center justify-between gap-3 text-xs flex-wrap ${
        isDarkMode ? 'bg-slate-900/40 border-slate-800/80' : 'bg-slate-50 border-slate-200'
      }`}>
        <div className="flex items-center gap-2 flex-wrap text-[11px] font-mono">
          {/* Active Connection Route Badge */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-bold ${
            activeRoute === 'primary'
              ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300'
              : 'bg-amber-950/60 border-amber-500/40 text-amber-300'
          }`}>
            <Zap className={`w-3.5 h-3.5 ${activeRoute === 'primary' ? 'text-cyan-400 fill-cyan-400' : 'text-amber-400'}`} />
            <span>{activeRoute === 'primary' ? 'Tailscale Direct (1 Gbps Mesh)' : 'Cloudflare Redundant Fallback'}</span>
            <span className="opacity-60 text-[10px]">({latencyMs}ms)</span>
          </div>

          {/* Rust notify_push Status */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border bg-slate-950/50 border-slate-800 text-slate-300">
            <span className={`w-2 h-2 rounded-full ${isPushConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
            <span>notify_push: {isPushConnected ? 'Real-Time WS Active' : 'Connecting /push/ws'}</span>
          </div>

          {/* In-Memory APCu / Bus Cache Indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border bg-slate-950/50 border-slate-800 text-slate-300">
            <Activity className="w-3.5 h-3.5 text-purple-400" />
            <span>RAM Cache: {isFromCache ? 'Bus Speed (<2ms)' : 'Live Edge Sync'}</span>
          </div>
        </div>

        {/* Rapid Redundancy & Cache Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePurgeCache}
            className="px-2.5 py-1 rounded-lg border border-slate-700 hover:border-slate-500 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[11px] font-mono font-medium transition cursor-pointer"
            title="Purge in-memory PROPFIND RAM cache and force fresh read from Nextcloud APCu / Redis"
          >
            Purge Cache
          </button>

          <button
            type="button"
            onClick={handleToggleRoute}
            disabled={isSwitchingRoute}
            className="px-2.5 py-1 rounded-lg border border-indigo-700/50 hover:border-indigo-500 bg-indigo-950/50 hover:bg-indigo-900/60 text-indigo-300 text-[11px] font-mono font-medium transition cursor-pointer flex items-center gap-1"
            title="Test automatic failover between Tailscale Direct (1 Gbps) and Cloudflare Redundant Fallback"
          >
            <Repeat className="w-3 h-3" />
            <span>Test Failover</span>
          </button>
        </div>
      </div>

      {/* BREADCRUMB & NAVIGATION BAR */}
      <div className={`px-4 py-2.5 border-b flex items-center justify-between gap-3 text-xs overflow-x-auto ${
        isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-100/70 border-slate-200'
      }`}>
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <button
            onClick={handleNavigateUp}
            disabled={!parentPath || isLoading}
            className={`p-1.5 rounded-lg border transition ${
              parentPath
                ? isDarkMode
                  ? 'border-slate-700 text-slate-300 hover:bg-slate-800 cursor-pointer'
                  : 'border-slate-300 text-slate-700 hover:bg-white cursor-pointer'
                : 'opacity-40 cursor-not-allowed border-transparent text-slate-500'
            }`}
            title="Up one folder"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-center gap-1 flex-wrap min-w-0 font-mono">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={crumb.path}>
                {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
                <button
                  onClick={() => handleNavigateToFolder(crumb.path)}
                  className={`px-2 py-0.5 rounded transition text-xs truncate max-w-[200px] cursor-pointer ${
                    idx === breadcrumbs.length - 1
                      ? 'bg-indigo-600/20 text-indigo-400 font-bold border border-indigo-500/30'
                      : isDarkMode
                      ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                  }`}
                  title={crumb.path}
                >
                  {crumb.name}
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* View Mode & Count */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-mono text-slate-400">
            {filteredFolders.length} folders · {filteredFiles.length} files
          </span>
          <div className={`flex items-center rounded-lg border p-0.5 ${
            isDarkMode ? 'border-slate-800 bg-slate-950' : 'border-slate-300 bg-white'
          }`}>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1 rounded transition cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1 rounded transition cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="List View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH TOOLBAR */}
      <div className={`px-4 py-2 border-b flex flex-wrap items-center justify-between gap-3 text-xs ${
        isDarkMode ? 'bg-slate-900/30 border-slate-800/80' : 'bg-white border-slate-200'
      }`}>
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {(['ALL', 'AUDIO', 'STEMS', 'VISUALS', 'VIDEOS', 'DOCS'] as const).map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer border ${
                filterType === type
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-xs'
                  : isDarkMode
                  ? 'border-slate-800 bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800'
                  : 'border-slate-200 bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              {type === 'ALL' && 'All Assets'}
              {type === 'AUDIO' && '🎵 Masters & Mixes'}
              {type === 'STEMS' && '🎛️ Stems'}
              {type === 'VISUALS' && '🖼️ Visuals & Art'}
              {type === 'VIDEOS' && '🎬 Videos'}
              {type === 'DOCS' && '📄 Lyrics & Docs'}
            </button>
          ))}
        </div>

        {/* Search & Sort */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search current folder..."
              className={`pl-8 pr-3 py-1 rounded-lg text-xs border focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                isDarkMode
                  ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500'
                  : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className={`px-2 py-1 rounded-lg text-xs border font-mono ${
              isDarkMode
                ? 'bg-slate-950 border-slate-800 text-slate-300'
                : 'bg-white border-slate-300 text-slate-700'
            }`}
          >
            <option value="name">Sort by Name</option>
            <option value="size">Sort by Size</option>
            <option value="date">Sort by Date</option>
            <option value="type">Sort by Type</option>
          </select>

          <button
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            className={`px-2 py-1 rounded-lg border text-xs font-mono ${
              isDarkMode ? 'border-slate-800 text-slate-400 hover:text-white' : 'border-slate-300 text-slate-600'
            }`}
            title="Toggle sort direction"
          >
            {sortOrder === 'asc' ? '▲ ASC' : '▼ DESC'}
          </button>
        </div>
      </div>

      {/* MAIN TWO-COLUMN BODY */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* LEFT COLUMN: SONG PROJECT BOOKMARKS SIDEBAR */}
        <div className={`w-64 shrink-0 border-r flex flex-col p-3 overflow-y-auto hidden md:flex ${
          isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-100/50 border-slate-200'
        }`}>
          <div className="mb-2">
            <span className={`text-[10px] font-black uppercase tracking-wider ${
              isDarkMode ? 'text-slate-400' : 'text-slate-500'
            }`}>
              Catalog Song Projects
            </span>
          </div>

          <div className="space-y-1 flex-1">
            {songProjectShortcuts.map(proj => {
              const projectPath = `/remote.php/dav/files/ncted/Music-Production/${proj.name}`;
              const isSelected = currentPath.includes(proj.name);

              return (
                <button
                  key={proj.name}
                  onClick={() => handleNavigateToFolder(projectPath)}
                  className={`w-full text-left p-2 rounded-xl border flex items-center justify-between gap-2 transition cursor-pointer text-xs ${
                    isSelected
                      ? 'bg-indigo-600/15 border-indigo-500/50 text-indigo-300 font-bold'
                      : isDarkMode
                      ? 'border-transparent text-slate-300 hover:bg-slate-900 hover:border-slate-800'
                      : 'border-transparent text-slate-700 hover:bg-white hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Folder className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-indigo-400' : 'text-slate-400'}`} />
                    <span className="truncate">{proj.title}</span>
                  </div>
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded shrink-0 ${
                    isSelected
                      ? 'bg-indigo-500/20 text-indigo-300'
                      : isDarkMode
                      ? 'bg-slate-900 text-slate-500'
                      : 'bg-slate-200 text-slate-600'
                  }`}>
                    {proj.trackId}
                  </span>
                </button>
              );
            })}
          </div>

          <div className={`mt-3 pt-3 border-t text-[11px] space-y-1 ${
            isDarkMode ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'
          }`}>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Nextcloud WebDAV 207332</span>
            </div>
            <p className="text-[10px] text-slate-500 font-mono">
              Lossless PCM 24-bit / 48kHz WAV audio vault
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: MAIN FOLDER & FILE DISPLAY */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto p-4 space-y-6">
          {/* Error / Auth Required Banner */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <button
                onClick={() => fetchDirectory(currentPath)}
                className="px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-bold"
              >
                Retry
              </button>
            </div>
          )}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin text-indigo-400" />
              <p className="text-xs font-mono">Reading Nextcloud WebDAV directory via PROPFIND...</p>
            </div>
          )}

          {!isLoading && filteredFolders.length === 0 && filteredFiles.length === 0 && (
            <div className="py-16 text-center text-slate-400 space-y-3">
              <Folder className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="text-sm font-bold">This directory is empty</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No files or subdirectories found in {currentPath}. You can create a folder or upload music stems to start organizing.
              </p>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  onClick={() => setIsNewFolderOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold border border-slate-700"
                >
                  Create Folder
                </button>
                <button
                  onClick={() => setIsUploadOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
                >
                  Upload Files
                </button>
              </div>
            </div>
          )}

          {/* SUBFOLDERS SECTION */}
          {!isLoading && filteredFolders.length > 0 && (
            <div className="space-y-2">
              <h3 className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                isDarkMode ? 'text-slate-400' : 'text-slate-600'
              }`}>
                <Folder className="w-3.5 h-3.5 text-cyan-400" />
                <span>Folders ({filteredFolders.length})</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
                {filteredFolders.map(folder => (
                  <div
                    key={folder.path}
                    className={`group relative p-3 rounded-xl border transition flex items-center justify-between gap-2.5 cursor-pointer ${
                      isDarkMode
                        ? 'bg-slate-900/70 border-slate-800 hover:border-cyan-500/50 hover:bg-slate-850'
                        : 'bg-white border-slate-200 hover:border-cyan-500 hover:bg-slate-50 shadow-2xs'
                    }`}
                    onClick={() => handleNavigateToFolder(folder.path)}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition shrink-0">
                        <Folder className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="block text-xs font-bold truncate group-hover:text-cyan-400 transition">
                          {folder.name}
                        </span>
                        {folder.isProjectFolder && (
                          <span className="text-[10px] text-indigo-400 font-mono">
                            Project Folder
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions Menu */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => {
                          setRenameTarget({ path: folder.path, name: folder.name, isFolder: true });
                          setRenameInput(folder.name);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
                        title="Rename folder"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget({ path: folder.path, name: folder.name, isFolder: true })}
                        className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                        title="Delete folder"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FILES SECTION */}
          {!isLoading && filteredFiles.length > 0 && (
            <div className="space-y-2">
              <h3 className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                isDarkMode ? 'text-slate-400' : 'text-slate-600'
              }`}>
                <File className="w-3.5 h-3.5 text-indigo-400" />
                <span>Files & Audio Assets ({filteredFiles.length})</span>
              </h3>

              {viewMode === 'grid' ? (
                /* GRID VIEW */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {filteredFiles.map(file => {
                    const isCurrentPlaying = activeAudio?.path === file.path && isPlaying;

                    return (
                      <div
                        key={file.path}
                        className={`group relative p-3.5 rounded-xl border flex flex-col justify-between gap-3 transition ${
                          isCurrentPlaying
                            ? 'bg-indigo-950/40 border-indigo-500 shadow-md shadow-indigo-950/40'
                            : isDarkMode
                            ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                            : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                        }`}
                      >
                        {/* File Card Top: Icon, Category & Actions */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                              file.isAudio
                                ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30'
                                : file.isImage
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : file.isVideo
                                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                : 'bg-slate-800 text-slate-300'
                            }`}>
                              {file.isAudio && <Music className="w-4 h-4" />}
                              {file.isImage && <ImageIcon className="w-4 h-4" />}
                              {file.isVideo && <Video className="w-4 h-4" />}
                              {file.isDocument && <FileText className="w-4 h-4" />}
                              {!file.isAudio && !file.isImage && !file.isVideo && !file.isDocument && <FileCode className="w-4 h-4" />}
                            </div>

                            <div className="min-w-0">
                              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                                file.category === 'Master Audio'
                                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                  : file.isAudio
                                  ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                                  : 'bg-slate-800 text-slate-400'
                              }`}>
                                {file.category}
                              </span>
                              <span className="block text-[10px] text-slate-500 font-mono mt-0.5">
                                {formatBytes(file.size)}
                              </span>
                            </div>
                          </div>

                          {/* Quick Audition Play Button for Audio */}
                          {file.isAudio && (
                            <button
                              onClick={() => handleTogglePlay(file)}
                              className={`p-2 rounded-xl transition cursor-pointer shadow-md ${
                                isCurrentPlaying
                                  ? 'bg-indigo-600 text-white animate-pulse'
                                  : 'bg-indigo-500/20 hover:bg-indigo-600 hover:text-white text-indigo-300'
                              }`}
                              title={isCurrentPlaying ? 'Pause audition' : 'Audition stream'}
                            >
                              {isCurrentPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                            </button>
                          )}
                        </div>

                        {/* Middle: File Name */}
                        <div>
                          <p
                            className="text-xs font-bold truncate group-hover:text-indigo-400 transition"
                            title={file.name}
                          >
                            {file.name}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono truncate">
                            {file.extension.toUpperCase()} · {new Date(file.lastModified).toLocaleDateString()}
                          </p>
                        </div>

                        {/* Bottom: Action Buttons */}
                        <div className={`pt-2 border-t flex items-center justify-between gap-1 text-[11px] ${
                          isDarkMode ? 'border-slate-800/80' : 'border-slate-100'
                        }`}>
                          <div className="flex items-center gap-1">
                            {file.isAudio && onSendToMixer && (
                              <button
                                onClick={() => onSendToMixer(file, 0)}
                                className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 transition cursor-pointer flex items-center gap-1"
                                title="Send audio to Mini-DAW multi-track mixer channel"
                              >
                                <Sliders className="w-3 h-3" />
                                <span>DAW</span>
                              </button>
                            )}

                            {(file.isDocument || file.isImage) && (
                              <button
                                onClick={() => handleOpenPreview(file)}
                                className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer flex items-center gap-1"
                              >
                                <Eye className="w-3 h-3" />
                                <span>View</span>
                              </button>
                            )}

                            <a
                              href={file.streamUrl}
                              download={file.name}
                              className="p-1 rounded text-slate-400 hover:text-white transition"
                              title="Download file"
                            >
                              <Download className="w-3 h-3" />
                            </a>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(window.location.origin + file.streamUrl);
                                showToast('Copied stream URL to clipboard!');
                              }}
                              className="p-1 rounded text-slate-400 hover:text-white transition"
                              title="Copy direct stream link"
                            >
                              <LinkIcon className="w-3 h-3" />
                            </button>

                            <button
                              onClick={() => {
                                setRenameTarget({ path: file.path, name: file.name, isFolder: false });
                                setRenameInput(file.name);
                              }}
                              className="p-1 rounded text-slate-400 hover:text-white transition"
                              title="Rename file"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>

                            <button
                              onClick={() => setDeleteTarget({ path: file.path, name: file.name, isFolder: false })}
                              className="p-1 rounded text-slate-400 hover:text-rose-400 transition"
                              title="Delete file"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* LIST VIEW */
                <div className={`rounded-xl border overflow-hidden ${
                  isDarkMode ? 'border-slate-800 bg-slate-900/40' : 'border-slate-200 bg-white'
                }`}>
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className={`border-b text-[10px] font-mono font-bold uppercase tracking-wider ${
                        isDarkMode ? 'border-slate-800 bg-slate-950 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-500'
                      }`}>
                        <th className="py-2.5 px-4">Name</th>
                        <th className="py-2.5 px-3">Type</th>
                        <th className="py-2.5 px-3">Size</th>
                        <th className="py-2.5 px-3">Date Modified</th>
                        <th className="py-2.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {filteredFiles.map(file => {
                        const isCurrentPlaying = activeAudio?.path === file.path && isPlaying;

                        return (
                          <tr
                            key={file.path}
                            className={`group transition ${
                              isCurrentPlaying
                                ? 'bg-indigo-950/30'
                                : isDarkMode
                                ? 'hover:bg-slate-800/40'
                                : 'hover:bg-slate-50'
                            }`}
                          >
                            <td className="py-2 px-4 flex items-center gap-2.5 min-w-0">
                              {file.isAudio ? (
                                <button
                                  onClick={() => handleTogglePlay(file)}
                                  className={`p-1.5 rounded-lg transition shrink-0 cursor-pointer ${
                                    isCurrentPlaying
                                      ? 'bg-indigo-600 text-white'
                                      : 'bg-indigo-500/20 text-indigo-400 hover:bg-indigo-600 hover:text-white'
                                  }`}
                                >
                                  {isCurrentPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                                </button>
                              ) : (
                                <div className="p-1.5 rounded-lg bg-slate-800 text-slate-400 shrink-0">
                                  {file.isImage && <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />}
                                  {file.isVideo && <Video className="w-3.5 h-3.5 text-amber-400" />}
                                  {file.isDocument && <FileText className="w-3.5 h-3.5 text-blue-400" />}
                                  {!file.isImage && !file.isVideo && !file.isDocument && <FileCode className="w-3.5 h-3.5" />}
                                </div>
                              )}
                              <span className="font-bold truncate max-w-sm">{file.name}</span>
                            </td>
                            <td className="py-2 px-3">
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                                {file.category}
                              </span>
                            </td>
                            <td className="py-2 px-3 font-mono text-[11px] text-slate-400">
                              {formatBytes(file.size)}
                            </td>
                            <td className="py-2 px-3 font-mono text-[11px] text-slate-500">
                              {new Date(file.lastModified).toLocaleDateString()}
                            </td>
                            <td className="py-2 px-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                {file.isAudio && onSendToMixer && (
                                  <button
                                    onClick={() => onSendToMixer(file, 0)}
                                    className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20"
                                    title="Send to Mini-DAW"
                                  >
                                    DAW
                                  </button>
                                )}
                                <a
                                  href={file.streamUrl}
                                  download={file.name}
                                  className="p-1 text-slate-400 hover:text-white"
                                  title="Download"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </a>
                                <button
                                  onClick={() => {
                                    setRenameTarget({ path: file.path, name: file.name, isFolder: false });
                                    setRenameInput(file.name);
                                  }}
                                  className="p-1 text-slate-400 hover:text-white"
                                  title="Rename"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setDeleteTarget({ path: file.path, name: file.name, isFolder: false })}
                                  className="p-1 text-slate-400 hover:text-rose-400"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* STICKY BOTTOM AUDIO AUDITION TRANSPORT DOCK */}
      {activeAudio && (
        <div className={`p-3.5 border-t flex flex-wrap items-center justify-between gap-4 transition-all z-20 ${
          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-lg'
        }`}>
          {/* Left: Current Track Details */}
          <div className="flex items-center gap-3 min-w-0 max-w-sm">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md">
              <Music className={`w-4 h-4 ${isPlaying ? 'animate-bounce' : ''}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black truncate">{activeAudio.name}</p>
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
                <span className="text-indigo-400 font-bold">{activeAudio.category}</span>
                <span>·</span>
                <span>{formatBytes(activeAudio.size)}</span>
              </div>
            </div>
          </div>

          {/* Center: Scrubber & Playback Controls */}
          <div className="flex-1 max-w-xl flex flex-col items-center gap-1.5">
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleTogglePlay(activeAudio)}
                disabled={audioLoading}
                className="w-8 h-8 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition shadow-md cursor-pointer"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
              </button>

              <button
                onClick={() => setIsLooping(prev => !prev)}
                className={`p-1.5 rounded-lg border text-xs transition cursor-pointer ${
                  isLooping
                    ? 'bg-indigo-600 border-indigo-400 text-white'
                    : isDarkMode
                    ? 'border-slate-800 text-slate-400 hover:text-white'
                    : 'border-slate-200 text-slate-600'
                }`}
                title="Toggle Loop"
              >
                <Repeat className="w-3.5 h-3.5" />
              </button>

              <span className="text-[11px] font-mono text-slate-400 min-w-[70px] text-center">
                {formatSeconds(currentTime)} / {formatSeconds(duration)}
              </span>
            </div>

            {/* Scrubber Bar */}
            <div className="w-full flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={(e) => handleSeek(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>
          </div>

          {/* Right: Volume & Mixer Dispatch */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <button onClick={handleToggleMute} className="text-slate-400 hover:text-white">
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-20 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            {onSendToMixer && (
              <button
                onClick={() => onSendToMixer(activeAudio, 0)}
                className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-cyan-950/40"
                title="Send current stem to Mini-DAW"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Load in DAW</span>
              </button>
            )}

            <button
              onClick={() => {
                if (audioRef.current) audioRef.current.pause();
                setIsPlaying(false);
                setActiveAudio(null);
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-white"
              title="Close audition player"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* CREATE FOLDER MODAL */}
      {isNewFolderOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`w-full max-w-md p-6 rounded-2xl border shadow-2xl space-y-4 ${
            isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-cyan-400" />
                <h3 className="font-black text-sm uppercase">Create New Folder</h3>
              </div>
              <button onClick={() => setIsNewFolderOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Creating folder in: <span className="font-mono text-cyan-300">{currentPath}</span>
            </p>

            <form onSubmit={handleCreateFolder} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Folder Name
                </label>
                <input
                  type="text"
                  required
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="e.g. MMH-StemMix-v2 or Drum-Takes"
                  className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                    isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewFolderOpen(false)}
                  className="px-4 py-2 rounded-xl border text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingFolder || !newFolderName.trim()}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  {isCreatingFolder && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Create on Nextcloud</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPLOAD ASSET MODAL */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`w-full max-w-lg p-6 rounded-2xl border shadow-2xl space-y-4 ${
            isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-indigo-400" />
                <h3 className="font-black text-sm uppercase">Upload Assets to Nextcloud</h3>
              </div>
              <button onClick={() => setIsUploadOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Destination directory: <span className="font-mono text-indigo-300">{currentPath}</span>
            </p>

            <div className={`border-2 border-dashed rounded-2xl p-8 text-center space-y-3 transition ${
              isDarkMode ? 'border-slate-800 hover:border-indigo-500 bg-slate-950/60' : 'border-slate-300 hover:border-indigo-500 bg-slate-50'
            }`}>
              <Upload className="w-10 h-10 text-indigo-400 mx-auto" />
              <div>
                <p className="text-xs font-bold">Select audio stems, artwork, or lyrics files</p>
                <p className="text-[11px] text-slate-500 mt-1">Supports WAV, MP3, FLAC, PNG, JPG, MP4, Markdown, and PDF</p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                id="nc-file-upload-input"
              />

              <label
                htmlFor="nc-file-upload-input"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer transition shadow-md"
              >
                <span>Browse Local Files</span>
              </label>
            </div>

            {isUploading && (
              <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center gap-2 text-indigo-300 text-xs">
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-400 shrink-0" />
                <span>{uploadProgress}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* RENAME MODAL */}
      {renameTarget && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`w-full max-w-md p-6 rounded-2xl border shadow-2xl space-y-4 ${
            isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-indigo-400" />
                <h3 className="font-black text-sm uppercase">Rename {renameTarget.isFolder ? 'Folder' : 'File'}</h3>
              </div>
              <button onClick={() => setRenameTarget(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRenameItem} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  New Name
                </label>
                <input
                  type="text"
                  required
                  value={renameInput}
                  onChange={(e) => setRenameInput(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRenameTarget(null)}
                  className="px-4 py-2 rounded-xl border text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRenaming || !renameInput.trim()}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  {isRenaming && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save via WebDAV MOVE</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`w-full max-w-md p-6 rounded-2xl border shadow-2xl space-y-4 ${
            isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center gap-2 text-rose-400">
              <Trash2 className="w-5 h-5 shrink-0" />
              <h3 className="font-black text-sm uppercase">Delete from Nextcloud?</h3>
            </div>

            <p className="text-xs text-slate-300">
              Are you sure you want to permanently delete {deleteTarget.isFolder ? 'folder' : 'file'}:
            </p>
            <p className="font-mono text-xs text-rose-300 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20 break-all">
              {deleteTarget.path}
            </p>
            <p className="text-[11px] text-slate-500">
              This will execute a WebDAV DELETE request against the remote Nextcloud server.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl border text-xs font-bold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteItem}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md"
              >
                {isDeleting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm Permanent Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX / PREVIEW MODAL */}
      {previewFile && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-3xl max-h-[85vh] rounded-2xl border flex flex-col shadow-2xl overflow-hidden ${
            isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="p-4 border-b flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-black text-sm truncate">{previewFile.name}</h3>
                <p className="text-[10px] text-slate-400 font-mono">
                  {previewFile.category} · {formatBytes(previewFile.size)} · {previewFile.path}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewFile.streamUrl}
                  download={previewFile.name}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
                <button onClick={() => setPreviewFile(null)} className="p-1 rounded text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 p-6 overflow-y-auto flex items-center justify-center">
              {previewFile.isImage && (
                <img
                  src={previewFile.streamUrl}
                  alt={previewFile.name}
                  className="max-h-[60vh] max-w-full rounded-xl object-contain shadow-xl"
                />
              )}

              {previewFile.isDocument && (
                <div className="w-full h-full">
                  {isLoadingPreview ? (
                    <div className="py-12 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-400" />
                      <p className="text-xs">Loading document...</p>
                    </div>
                  ) : (
                    <pre className="p-4 rounded-xl bg-slate-950 font-mono text-xs text-slate-300 whitespace-pre-wrap overflow-x-auto max-h-[60vh] border border-slate-800">
                      {previewContent}
                    </pre>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAILSCALE MESH VPN MODAL */}
      <TailscaleVpnModal
        isOpen={isTailscaleModalOpen}
        onClose={() => setIsTailscaleModalOpen(false)}
        isDarkMode={isDarkMode}
      />
    </div>
  );
};
