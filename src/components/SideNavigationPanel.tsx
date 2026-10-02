import React, { useState, useEffect } from 'react';
import {
  Disc,
  FolderKanban,
  HardDrive,
  Search,
  Plus,
  X,
  ChevronRight,
  Pin,
  PinOff,
  Trash2,
  Copy,
  Clock,
  CheckCircle,
  AlertCircle,
  Heart,
  Music,
  FileText,
  ImageIcon,
  Video,
  Play,
  Pause,
  Download,
  Filter,
  Layers,
  Sparkles,
  Sliders,
  ExternalLink,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Folder,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Edit3,
  Link as LinkIcon,
  Wand2,
  Terminal,
  Lock,
  Unlock,
  Check,
  Activity,
  AlertTriangle,
  Zap
} from 'lucide-react';
import { Track, TrackStatus, CompositionSession, GeneratedImage, GeneratedVideo, UniversalAssetItem, NextcloudLogEntry, NextcloudFolderAsset, NextcloudSyncConfig, NextcloudAssetCategory } from '../types';
import { EP_COLLECTIONS } from '../data/canonicalCatalog';
import { audioMiniDaw } from '../utils/audioEngine';
import { TIER_1_NAV_ITEMS, TIER_2_NAV_ITEMS, StudioNavItem } from '../data/studioNavigationData';
import { UniversalAssetEditorModal } from './UniversalAssetEditorModal';
import { getTrackStems, getTrackNextcloudAssets, NEXTCLOUD_SHARE_ROOT } from '../data/nextcloudAssetIndex';
import { getSavedNextcloudConfig, saveNextcloudConfig, saveNextcloudAssets, autoMatchAssetToCatalog, buildNextcloudStreamUrl } from '../data/nextcloudFolderAssets';
import type { StudioWorkspace } from './StudioHome';

interface SideNavigationPanelProps {
  tracks: Track[];
  selectedTrack: Track;
  onSelectTrack: (track: Track) => void;
  onAddNewTrack: () => void;
  sessions: CompositionSession[];
  activeSessionId: string | null;
  onSelectSession: (session: CompositionSession) => void;
  onSaveCurrentSession: (name: string, description: string, tags: string[], isPinned: boolean) => Promise<void>;
  onUpdateSessionSnapshot: (sessionId: string) => Promise<void>;
  onDuplicateSession: (session: CompositionSession) => Promise<void>;
  onDeleteSession: (sessionId: string) => Promise<void>;
  onTogglePinSession: (session: CompositionSession) => Promise<void>;
  generatedImages?: GeneratedImage[];
  generatedVideos?: GeneratedVideo[];
  onUpdateImage?: (updatedImage: GeneratedImage) => void;
  onDeleteImage?: (imageId: string) => void;
  onAddImage?: (newImage: GeneratedImage) => void;
  onUpdateVideo?: (updatedVideo: GeneratedVideo) => void;
  onDeleteVideo?: (videoId: string) => void;
  onAddVideo?: (newVideo: GeneratedVideo) => void;
  isDbSyncing?: boolean;
  activeTab: string;
  onNavigateToTab: (tab: any) => void;
  activePanelTab: 'projects' | 'sessions' | 'assets';
  onSetActivePanelTab: (tab: 'projects' | 'sessions' | 'assets') => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onClose?: () => void;
  isDarkMode?: boolean;
  workspaceMode?: StudioWorkspace;
}

export const SideNavigationPanel: React.FC<SideNavigationPanelProps> = ({
  tracks,
  selectedTrack,
  onSelectTrack,
  onAddNewTrack,
  sessions,
  activeSessionId,
  onSelectSession,
  onSaveCurrentSession,
  onUpdateSessionSnapshot,
  onDuplicateSession,
  onDeleteSession,
  onTogglePinSession,
  generatedImages = [],
  generatedVideos = [],
  onUpdateImage,
  onDeleteImage,
  onAddImage,
  onUpdateVideo,
  onDeleteVideo,
  onAddVideo,
  isDbSyncing = false,
  activeTab,
  onNavigateToTab,
  activePanelTab,
  onSetActivePanelTab,
  isCollapsed,
  onToggleCollapse,
  onClose,
  isDarkMode = true,
  workspaceMode = 'all',
}) => {
  // Search & Filter state for Projects
  const [projectSearch, setProjectSearch] = useState('');
  const [projectEpFilter, setProjectEpFilter] = useState('ALL');

  // Search & Filter state for Sessions
  const [sessionSearch, setSessionSearch] = useState('');
  const [sessionFilterMode, setSessionFilterMode] = useState<'all' | 'pinned' | 'current_track'>('all');
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');
  const [newSessionDesc, setNewSessionDesc] = useState('');
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);
  const [newSessionTags, setNewSessionTags] = useState<string[]>(['Lyrics Polish']);
  const [newSessionPinned, setNewSessionPinned] = useState(false);

  // Asset Manager state
  const [assetFilter, setAssetFilter] = useState<'all' | 'stems' | 'nextcloud' | 'lyrics' | 'visuals' | 'videos'>('all');
  const [playingStemId, setPlayingStemId] = useState<number | null>(null);

  const workspaceTabIds: Record<StudioWorkspace, string[] | null> = {
    write: ['brainstorming', 'lyrics', 'version-matrix', 'prompt_library'],
    produce: ['kanban', 'nextcloud_sync', 'mixer', 'mastering'],
    release: ['mastering', 'youtube', 'omnipost', 'ministry', 'veo_visuals', 'video_express', 'nextcloud_sync'],
    all: null
  };
  const visibleWorkspaceTabs = workspaceTabIds[workspaceMode];
  const visibleTier1Items = visibleWorkspaceTabs ? TIER_1_NAV_ITEMS.filter(item => visibleWorkspaceTabs.includes(item.id)) : TIER_1_NAV_ITEMS;
  const visibleTier2Items = visibleWorkspaceTabs ? TIER_2_NAV_ITEMS.filter(item => visibleWorkspaceTabs.includes(item.id)) : TIER_2_NAV_ITEMS;

  // Nextcloud WebDAV Live Connection & Diagnostics State
  const [ncConfig, setNcConfig] = useState<NextcloudSyncConfig>(() => getSavedNextcloudConfig());
  const [ncAppPassword, setNcAppPassword] = useState(ncConfig.appPassword || '');
  const [showNcPassword, setShowNcPassword] = useState(false);
  const [isTestingNc, setIsTestingNc] = useState(false);
  const [ncConnectionStatus, setNcConnectionStatus] = useState<'idle' | 'connected' | 'unauthorized' | 'error'>(
    ncConfig.lastConnectionStatus || 'idle'
  );
  const [ncPingMs, setNcPingMs] = useState<number | null>(ncConfig.lastPingMs || null);
  const [ncDiagnosticLogs, setNcDiagnosticLogs] = useState<NextcloudLogEntry[]>([]);
  const [showDiagnosticLogs, setShowDiagnosticLogs] = useState(false);
  const [ncDiagnosticVerdict, setNcDiagnosticVerdict] = useState<string | null>(null);
  const [ncRecommendedAction, setNcRecommendedAction] = useState<string | null>(null);
  const [ncCopySuccess, setNcCopySuccess] = useState(false);
  const [isSyncingNcAssets, setIsSyncingNcAssets] = useState(false);
  const [ncSyncSuccessMsg, setNcSyncSuccessMsg] = useState<string | null>(null);

  // Canonical Nextcloud assets for current track
  const [ncAssets, setNcAssets] = useState<NextcloudFolderAsset[]>(() =>
    getTrackNextcloudAssets(selectedTrack.id, selectedTrack.title)
  );
  const [playingNcAssetId, setPlayingNcAssetId] = useState<string | null>(null);

  // Sync ncAssets whenever track changes
  useEffect(() => {
    setNcAssets(getTrackNextcloudAssets(selectedTrack.id, selectedTrack.title));
  }, [selectedTrack.id, selectedTrack.title]);

  // Sync saved credentials to server memory on mount or change so stream proxy is pre-authenticated
  useEffect(() => {
    if (ncAppPassword && ncAppPassword.trim().length > 0) {
      fetch('/api/nextcloud/save-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serverUrl: ncConfig.serverUrl,
          username: ncConfig.username,
          password: ncAppPassword.trim()
        })
      }).catch(() => {});
    }
  }, [ncAppPassword, ncConfig.serverUrl, ncConfig.username]);

  // Load diagnostic logs on mount
  useEffect(() => {
    fetchNcLogs();
  }, []);

  const fetchNcLogs = async () => {
    try {
      const res = await fetch('/api/nextcloud/logs');
      const data = await res.json();
      if (data.success && Array.isArray(data.logs)) {
        setNcDiagnosticLogs(data.logs);
      }
    } catch (_) {}
  };

  const handleTestNcConnection = async () => {
    setIsTestingNc(true);
    try {
      const res = await fetch('/api/nextcloud/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serverUrl: ncConfig.serverUrl,
          username: ncConfig.username,
          password: ncAppPassword,
          webdavPath: '/remote.php/dav/files/ncted/Music-Production'
        })
      });
      const data = await res.json();
      setNcPingMs(data.latencyMs || null);
      setNcDiagnosticVerdict(data.diagnosticSummary || data.message);
      setNcRecommendedAction(data.recommendedAction || null);

      const status = data.success ? 'connected' : data.isAuthRequired ? 'unauthorized' : 'error';
      setNcConnectionStatus(status);

      const updatedCfg: NextcloudSyncConfig = {
        ...ncConfig,
        appPassword: ncAppPassword,
        lastConnectionStatus: status,
        lastPingMs: data.latencyMs,
        lastSyncTimestamp: new Date().toLocaleTimeString()
      };
      setNcConfig(updatedCfg);
      saveNextcloudConfig(updatedCfg);

      await fetchNcLogs();
    } catch (err: any) {
      setNcConnectionStatus('error');
      setNcDiagnosticVerdict(`Network error: ${err.message || 'Cannot reach Nextcloud WebDAV service'}`);
    } finally {
      setIsTestingNc(false);
    }
  };

  const handleSaveNcPassword = async () => {
    const updatedCfg: NextcloudSyncConfig = {
      ...ncConfig,
      appPassword: ncAppPassword
    };
    setNcConfig(updatedCfg);
    saveNextcloudConfig(updatedCfg);
    await handleTestNcConnection();
  };

  // Live Query & Sync WebDAV Assets against Nextcloud /Music-Production
  const handleSyncNcAssets = async () => {
    setIsSyncingNcAssets(true);
    setNcSyncSuccessMsg(null);
    try {
      // Ensure server has latest credentials
      if (ncAppPassword) {
        await fetch('/api/nextcloud/save-credentials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            serverUrl: ncConfig.serverUrl,
            username: ncConfig.username,
            password: ncAppPassword
          })
        }).catch(() => {});
      }

      // Query live WebDAV directory
      const res = await fetch('/api/nextcloud/sync-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folderId: '207332',
          serverUrl: ncConfig.serverUrl,
          username: ncConfig.username,
          password: ncAppPassword,
          webdavPath: '/remote.php/dav/files/ncted/Music-Production',
          folderPath: '/Music-Production'
        })
      });
      const data = await res.json();
      const files: any[] = data.files || data.liveFiles || [];

      if (data.isLiveAuthenticated) {
        setNcConnectionStatus('connected');
        if (data.latencyMs) setNcPingMs(data.latencyMs);
      }

      // Also query track-specific subfolder if any
      let trackFiles: any[] = [];
      try {
        const trkRes = await fetch('/api/nextcloud/index-track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            trackId: selectedTrack.id,
            folderName: selectedTrack.id === 'TRK-03' ? 'ECV' : selectedTrack.id,
            aliases: [selectedTrack.id, selectedTrack.title.replace(/\s+/g, '_'), selectedTrack.title, 'ECV', 'Every_Candles_Victory'],
            serverUrl: ncConfig.serverUrl,
            username: ncConfig.username,
            password: ncAppPassword
          })
        });
        const trkData = await trkRes.json();
        if (trkData.files && trkData.files.length > 0) {
          trackFiles = trkData.files;
        }
      } catch (_) {}

      // Start with canonical assets
      const canonical = getTrackNextcloudAssets(selectedTrack.id, selectedTrack.title);
      const combinedMap = new Map<string, NextcloudFolderAsset>();
      canonical.forEach(a => combinedMap.set(a.filename, a));

      // Merge all live files from WebDAV
      const allFiles = [...files, ...trackFiles];
      allFiles.forEach((file: any, idx: number) => {
        const fn = file.name || file.filename;
        if (!fn) return;

        const lower = fn.toLowerCase();
        let cat: NextcloudAssetCategory = 'UNCATEGORIZED';
        let stemType: any = 'master';
        if (lower.endsWith('.wav') || lower.endsWith('.mp3') || lower.endsWith('.flac')) {
          if (lower.includes('vocal') || lower.includes('roformer') || lower.includes('lead')) {
            cat = 'UVR5_VOCAL_STEM';
            stemType = 'vocal';
          } else if (lower.includes('choir') || lower.includes('harmony') || lower.includes('harmonies')) {
            cat = 'UVR5_HARMONY_STEM';
            stemType = 'choir';
          } else if (lower.includes('drum') || lower.includes('percussion') || lower.includes('snare') || lower.includes('kick')) {
            cat = 'UVR5_DRUMS_STEM';
            stemType = 'drums';
          } else if (lower.includes('bass') || lower.includes('sub') || lower.includes('808')) {
            cat = 'UVR5_BASS_STEM';
            stemType = 'bass';
          } else if (lower.includes('organ') || lower.includes('b3') || lower.includes('leslie')) {
            cat = 'INSTRUMENTAL_STEM';
            stemType = 'organ';
          } else if (lower.includes('guitar') || lower.includes('acoustic')) {
            cat = 'INSTRUMENTAL_STEM';
            stemType = 'guitar';
          } else if (lower.includes('piano') || lower.includes('rhodes')) {
            cat = 'INSTRUMENTAL_STEM';
            stemType = 'piano';
          } else if (lower.includes('master') || lower.includes('final') || lower.includes('mix')) {
            cat = 'MASTER_AUDIO';
            stemType = 'master';
          } else {
            cat = 'INSTRUMENTAL_STEM';
            stemType = 'master';
          }
        } else if (lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg')) {
          cat = 'VISUAL_ARTWORK';
        } else if (lower.endsWith('.mp4') || lower.endsWith('.mov')) {
          cat = 'VIDEO_REEL';
        } else if (lower.endsWith('.md') || lower.endsWith('.txt')) {
          cat = 'LYRIC_SOP_DOC';
        }

        const webdavPath = file.href || file.webdavPath || `/remote.php/dav/files/ncted/Music-Production/${fn}`;
        const audioUrl = buildNextcloudStreamUrl(webdavPath);

        // Match against selectedTrack
        const match = autoMatchAssetToCatalog(fn, [selectedTrack]);
        const isMatched = match.matchedTrackId === selectedTrack.id ||
          lower.includes(selectedTrack.id.toLowerCase()) ||
          lower.includes(selectedTrack.title.toLowerCase().replace(/\s+/g, '_').slice(0, 8)) ||
          (selectedTrack.id === 'TRK-03' && (lower.includes('ecv') || lower.includes('candle')));

        const existing = combinedMap.get(fn);
        combinedMap.set(fn, {
          ...(existing || {}),
          id: existing?.id || `NC-LIVE-${Date.now()}-${idx}`,
          filename: fn,
          folderId: '207332',
          category: existing?.category || cat,
          fileSizeBytes: file.size || existing?.fileSizeBytes || 0,
          fileSizeFormatted: file.size ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : existing?.fileSizeFormatted || '15 KB',
          mimeType: file.mimeType || existing?.mimeType || 'application/octet-stream',
          webdavPath,
          audioUrl: (cat.includes('AUDIO') || cat.includes('STEM')) ? audioUrl : undefined,
          shareUrl: NEXTCLOUD_SHARE_ROOT,
          matchedTrackId: isMatched ? selectedTrack.id : existing?.matchedTrackId,
          matchedTrackTitle: isMatched ? selectedTrack.title : existing?.matchedTrackTitle,
          matchConfidence: isMatched ? 100 : existing?.matchConfidence || 0,
          linkedTrackIds: isMatched ? Array.from(new Set([...(existing?.linkedTrackIds || []), selectedTrack.id])) : existing?.linkedTrackIds || [],
          isMatched: isMatched || existing?.isMatched || false,
          bpm: selectedTrack.bpm,
          key: selectedTrack.key,
          stemType: existing?.stemType || stemType,
          notes: existing?.notes || `Synced live from Nextcloud WebDAV on ${new Date().toLocaleTimeString()}`,
          lastSyncedAt: new Date().toISOString()
        });
      });

      const updated = Array.from(combinedMap.values());
      setNcAssets(updated);
      try {
        localStorage.setItem(`brickos_nextcloud_live_assets_${selectedTrack.id}`, JSON.stringify(updated));
        localStorage.setItem('brickos_nextcloud_folder_207332_assets', JSON.stringify(updated));
      } catch (_) {}

      const fileCount = allFiles.length > 0 ? allFiles.length : updated.length;
      setNcSyncSuccessMsg(`✓ Synced ${fileCount} live WebDAV files & mapped assets to "${selectedTrack.title}"!`);
      setTimeout(() => setNcSyncSuccessMsg(null), 5000);
      await fetchNcLogs();
    } catch (err: any) {
      setNcDiagnosticVerdict(`Sync error: ${err.message || 'Cannot query WebDAV'}`);
    } finally {
      setIsSyncingNcAssets(false);
    }
  };

  const handleAutoLinkAllTrackAssets = () => {
    setNcAssets(prev => {
      const updated = prev.map(a => {
        const links = new Set(a.linkedTrackIds || []);
        links.add(selectedTrack.id);
        return {
          ...a,
          matchedTrackId: selectedTrack.id,
          matchedTrackTitle: selectedTrack.title,
          isMatched: true,
          matchConfidence: 100,
          linkedTrackIds: Array.from(links)
        };
      });
      try {
        localStorage.setItem(`brickos_nextcloud_live_assets_${selectedTrack.id}`, JSON.stringify(updated));
        localStorage.setItem('brickos_nextcloud_folder_207332_assets', JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });
    setNcSyncSuccessMsg(`✓ Linked all ${ncAssets.length} assets to current track "${selectedTrack.title}"!`);
    setTimeout(() => setNcSyncSuccessMsg(null), 4000);
  };

  const handleClearNcLogs = async () => {
    try {
      await fetch('/api/nextcloud/clear-logs', { method: 'POST' });
      setNcDiagnosticLogs([]);
    } catch (_) {}
  };

  const handleCopyDiagnostics = () => {
    const report = {
      timestamp: new Date().toISOString(),
      serverUrl: ncConfig.serverUrl,
      username: ncConfig.username,
      webdavRoot: ncConfig.webdavRoot,
      status: ncConnectionStatus,
      pingMs: ncPingMs,
      verdict: ncDiagnosticVerdict,
      recommendedAction: ncRecommendedAction,
      recentLogs: ncDiagnosticLogs.slice(0, 15)
    };
    navigator.clipboard.writeText(JSON.stringify(report, null, 2));
    setNcCopySuccess(true);
    setTimeout(() => setNcCopySuccess(false), 3000);
  };

  const handleTogglePlayNcAsset = (asset: NextcloudFolderAsset) => {
    if (playingNcAssetId === asset.id) {
      audioMiniDaw.stopPlayback();
      setPlayingNcAssetId(null);
    } else {
      audioMiniDaw.stopPlayback();
      setPlayingStemId(null);
      const bpm = asset.bpm || selectedTrack.bpm || 80;
      const key = asset.key || selectedTrack.key || 'G Major';
      const fn = (asset.filename || '').toLowerCase();
      let stemType = asset.stemType || 'master';

      if (asset.category === 'UVR5_DRUMS_STEM' || fn.includes('drum') || fn.includes('percussion') || fn.includes('snare') || fn.includes('kick')) {
        stemType = 'drums';
      } else if (asset.category === 'UVR5_BASS_STEM' || fn.includes('bass') || fn.includes('sub')) {
        stemType = 'bass';
      } else if (fn.includes('organ') || fn.includes('b3') || fn.includes('leslie')) {
        stemType = 'organ';
      } else if (fn.includes('guitar') || fn.includes('acoustic')) {
        stemType = 'guitar';
      } else if (fn.includes('piano') || fn.includes('rhodes')) {
        stemType = 'piano';
      } else if (asset.category === 'UVR5_HARMONY_STEM' || fn.includes('choir') || fn.includes('harmony')) {
        stemType = 'choir';
      } else if (asset.category === 'UVR5_VOCAL_STEM' || fn.includes('vocal') || fn.includes('lead')) {
        stemType = 'vocal';
      } else {
        stemType = 'master';
      }

      const webdavPath = asset.webdavPath || `/remote.php/dav/files/ncted/Music-Production/${asset.filename}`;
      const audioUrl = buildNextcloudStreamUrl(webdavPath);

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
            freq: asset.freq || (stemType === 'drums' ? 120 : stemType === 'bass' ? 65 : stemType === 'vocal' ? 220 : 196),
            waveType: asset.waveType || (stemType === 'drums' ? 'square' : 'sawtooth'),
            stemType: stemType as any,
            color: asset.color || '#06b6d4',
            audioUrl,
            webdavPath,
            isRealAudio: true
          }
        ],
        bpm,
        key
      );
      setPlayingNcAssetId(asset.id);
    }
  };

  const handleToggleLinkNcAsset = (assetId: string) => {
    setNcAssets(prev => {
      const nextList = prev.map(a => {
        if (a.id === assetId) {
          const links = a.linkedTrackIds || [];
          const isLinked = links.includes(selectedTrack.id) || a.matchedTrackId === selectedTrack.id;
          const next = isLinked ? links.filter(id => id !== selectedTrack.id) : [...links, selectedTrack.id];
          return {
            ...a,
            linkedTrackIds: next,
            isMatched: !isLinked
          };
        }
        return a;
      });
      try {
        localStorage.setItem(`brickos_nextcloud_live_assets_${selectedTrack.id}`, JSON.stringify(nextList));
        localStorage.setItem('brickos_nextcloud_folder_207332_assets', JSON.stringify(nextList));
      } catch (_) {}
      return nextList;
    });
  };

  // Universal Asset Editor Modal State
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [editingAssetItem, setEditingAssetItem] = useState<UniversalAssetItem | null>(null);
  const [assetModalMode, setAssetModalMode] = useState<'edit' | 'add' | 'gemini'>('edit');

  // Editable Stems state dynamically loaded from real track stems
  const [customStems, setCustomStems] = useState<Array<{
    id: number;
    name: string;
    type: string;
    size: string;
    format: string;
    trackId?: string;
    linkedTrackIds?: string[];
    freq?: number;
    waveType?: OscillatorType;
    color?: string;
    audioUrl?: string;
    webdavPath?: string;
  }>>(() => {
    const realStems = getTrackStems(selectedTrack);
    return realStems.map((s, idx) => ({
      id: s.id,
      name: s.name,
      type: (s.stemType as string) || (idx === 0 ? 'vocal' : idx === 1 ? 'choir' : idx === 2 ? 'organ' : 'drums'),
      size: idx === 0 ? '26.8 MB' : idx === 1 ? '24.2 MB' : idx === 2 ? '31.5 MB' : '28.4 MB',
      format: 'WAV 24-bit/48kHz',
      trackId: selectedTrack.id,
      linkedTrackIds: [],
      freq: s.freq,
      waveType: s.waveType,
      color: s.color,
      audioUrl: s.audioUrl,
      webdavPath: s.webdavPath
    }));
  });

  // Keep customStems in sync whenever selectedTrack changes
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`brickos_custom_stems_${selectedTrack.id}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCustomStems(parsed);
          return;
        }
      }
    } catch (_) {}

    const realStems = getTrackStems(selectedTrack);
    setCustomStems(
      realStems.map((s, idx) => ({
        id: s.id,
        name: s.name,
        type: (s.stemType as string) || (idx === 0 ? 'vocal' : idx === 1 ? 'choir' : idx === 2 ? 'organ' : 'drums'),
        size: idx === 0 ? '26.8 MB' : idx === 1 ? '24.2 MB' : idx === 2 ? '31.5 MB' : '28.4 MB',
        format: 'WAV 24-bit/48kHz',
        trackId: selectedTrack.id,
        linkedTrackIds: [],
        freq: s.freq,
        waveType: s.waveType,
        color: s.color,
        audioUrl: s.audioUrl,
        webdavPath: s.webdavPath
      }))
    );
  }, [selectedTrack.id]);

  const handleOpenEditImage = (img: GeneratedImage, mode: 'edit' | 'gemini' = 'edit') => {
    const item: UniversalAssetItem = {
      id: img.id,
      type: 'image',
      name: img.name || img.trackTitle || selectedTrack.title,
      url: img.url,
      prompt: img.prompt,
      notes: img.notes || '',
      trackId: img.trackId || selectedTrack.id,
      trackTitle: img.trackTitle || selectedTrack.title,
      linkedTrackIds: img.linkedTrackIds || [],
      category: img.category || 'Cover Art',
      aspectRatio: img.aspectRatio || '1:1',
      tags: img.tags || ['Visual', 'Cover Art'],
      timestamp: img.timestamp || new Date().toISOString().split('T')[0],
      originalRef: img
    };
    setEditingAssetItem(item);
    setAssetModalMode(mode);
    setIsAssetModalOpen(true);
  };

  const handleOpenEditVideo = (vid: GeneratedVideo, mode: 'edit' | 'gemini' = 'edit') => {
    const item: UniversalAssetItem = {
      id: vid.id,
      type: 'video',
      name: vid.name || `Veo: ${vid.prompt.slice(0, 24)}...`,
      url: vid.videoUrl || '',
      prompt: vid.prompt,
      notes: vid.notes || '',
      trackId: vid.trackId || selectedTrack.id,
      trackTitle: vid.trackTitle || selectedTrack.title,
      linkedTrackIds: vid.linkedTrackIds || [],
      category: vid.category || 'Veo Reel',
      aspectRatio: vid.aspectRatio || '16:9',
      tags: vid.tags || ['Veo', 'Video Reel'],
      timestamp: vid.timestamp || new Date().toISOString().split('T')[0],
      originalRef: vid
    };
    setEditingAssetItem(item);
    setAssetModalMode(mode);
    setIsAssetModalOpen(true);
  };

  const handleOpenEditStem = (stem: typeof customStems[0]) => {
    const item: UniversalAssetItem = {
      id: String(stem.id),
      type: 'stem',
      name: stem.name,
      url: '',
      prompt: '',
      notes: `${stem.format} • ${stem.size}`,
      trackId: stem.trackId || selectedTrack.id,
      trackTitle: selectedTrack.title,
      linkedTrackIds: stem.linkedTrackIds || [],
      category: 'UVR5 Isolated Stem',
      format: stem.format,
      fileSizeFormatted: stem.size,
      tags: ['Audio Stem', stem.type],
      timestamp: new Date().toISOString().split('T')[0],
      originalRef: stem
    };
    setEditingAssetItem(item);
    setAssetModalMode('edit');
    setIsAssetModalOpen(true);
  };

  const handleOpenAddAsset = (assetType: 'image' | 'video' | 'stem' = 'image') => {
    const item: UniversalAssetItem = {
      id: `asset-${assetType}-${Date.now()}`,
      type: assetType,
      name: assetType === 'image' ? 'New Studio Artwork' : assetType === 'video' ? 'New Veo Video Reel' : 'New Isolated Audio Stem',
      url: '',
      prompt: assetType === 'image' ? 'Cinematic album cover for sovereign faith album, weathered cedar wood, warm dramatic lighting, 8k photorealistic' : '',
      notes: '',
      trackId: selectedTrack.id,
      trackTitle: selectedTrack.title,
      linkedTrackIds: [],
      category: assetType === 'image' ? 'Cover Art' : assetType === 'video' ? 'Video Reel' : 'UVR5 Stem',
      aspectRatio: assetType === 'video' ? '16:9' : '1:1',
      tags: [assetType.toUpperCase(), 'Studio'],
      timestamp: new Date().toISOString().split('T')[0]
    };
    setEditingAssetItem(item);
    setAssetModalMode('add');
    setIsAssetModalOpen(true);
  };

  const handleSaveAssetFromModal = (updated: UniversalAssetItem) => {
    if (updated.type === 'image') {
      const imgObj: GeneratedImage = {
        id: updated.id,
        name: updated.name,
        url: updated.url || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800',
        prompt: updated.prompt || '',
        aspectRatio: updated.aspectRatio || '1:1',
        timestamp: updated.timestamp,
        mode: 'create',
        trackTitle: updated.trackTitle || selectedTrack.title,
        trackId: updated.trackId,
        linkedTrackIds: updated.linkedTrackIds,
        tags: updated.tags,
        notes: updated.notes,
        category: updated.category
      };
      if (onUpdateImage && generatedImages.some(img => img.id === updated.id)) {
        onUpdateImage(imgObj);
      } else if (onAddImage) {
        onAddImage(imgObj);
      }
    } else if (updated.type === 'video') {
      const vidObj: GeneratedVideo = {
        id: updated.id,
        name: updated.name,
        operationName: `op-${updated.id}`,
        prompt: updated.prompt || '',
        aspectRatio: (updated.aspectRatio === '9:16' ? '9:16' : '16:9'),
        videoUrl: updated.url,
        status: 'ready',
        timestamp: updated.timestamp,
        modelUsed: 'veo-3.1-generate-preview',
        trackTitle: updated.trackTitle || selectedTrack.title,
        trackId: updated.trackId,
        linkedTrackIds: updated.linkedTrackIds,
        tags: updated.tags,
        notes: updated.notes
      };
      if (onUpdateVideo && generatedVideos.some(v => v.id === updated.id)) {
        onUpdateVideo(vidObj);
      } else if (onAddVideo) {
        onAddVideo(vidObj);
      }
    } else if (updated.type === 'stem') {
      setCustomStems(prev => {
        const exists = prev.some(s => String(s.id) === updated.id);
        if (exists) {
          return prev.map(s => String(s.id) === updated.id ? { ...s, name: updated.name, format: updated.format || s.format, trackId: updated.trackId, linkedTrackIds: updated.linkedTrackIds } : s);
        }
        return [{ id: Date.now(), name: updated.name, type: 'vocal', size: updated.fileSizeFormatted || '24.0 MB', format: updated.format || 'WAV 24-bit/48kHz', trackId: updated.trackId, linkedTrackIds: updated.linkedTrackIds }, ...prev];
      });
    }
  };

  const handleDeleteAssetFromModal = (assetId: string) => {
    if (onDeleteImage && generatedImages.some(img => img.id === assetId)) {
      onDeleteImage(assetId);
    } else if (onDeleteVideo && generatedVideos.some(v => v.id === assetId)) {
      onDeleteVideo(assetId);
    } else {
      setCustomStems(prev => prev.filter(s => String(s.id) !== assetId));
    }
  };

  // Filtered tracks
  const filteredProjects = tracks.filter((t) => {
    const q = projectSearch.toLowerCase();
    const matchesSearch =
      t.title.toLowerCase().includes(q) ||
      t.id.toLowerCase().includes(q) ||
      t.genre.toLowerCase().includes(q) ||
      t.vocalCast.toLowerCase().includes(q);
    const matchesEp = projectEpFilter === 'ALL' || t.ep.includes(projectEpFilter);
    return matchesSearch && matchesEp;
  });

  // Filtered sessions
  const filteredSessions = sessions.filter((s) => {
    const matchesTrack = sessionFilterMode === 'current_track' ? s.trackId === selectedTrack.id : true;
    const matchesPinned = sessionFilterMode === 'pinned' ? s.isPinned : true;
    const q = sessionSearch.toLowerCase();
    const matchesSearch =
      s.name.toLowerCase().includes(q) ||
      s.trackTitle.toLowerCase().includes(q) ||
      s.tags.some((tag) => tag.toLowerCase().includes(q));
    return matchesTrack && matchesPinned && matchesSearch;
  });

  // Stem definitions for the active track
  const activeStems = [
    { id: 1, name: 'Lead Vocals (UVR5 Isolated)', type: 'vocal', size: '24.2 MB', format: 'WAV 24-bit/48kHz' },
    { id: 2, name: 'Backing Harmonies & Ad-libs', type: 'harmony', size: '18.6 MB', format: 'WAV 24-bit/48kHz' },
    { id: 3, name: 'Acoustic Guitar & Piano Bed', type: 'instrumental', size: '36.1 MB', format: 'WAV 24-bit/48kHz' },
    { id: 4, name: 'Sub-Bass & Kick / Percussion', type: 'drums', size: '28.4 MB', format: 'WAV 24-bit/48kHz' }
  ];

  const handleTogglePlayStem = (stemId: number) => {
    if (playingStemId === stemId) {
      audioMiniDaw.stopPlayback();
      setPlayingStemId(null);
    } else {
      audioMiniDaw.init();
      const targetStem = customStems.find(s => s.id === stemId);
      const stemType = targetStem?.type || 'vocal';
      const freq = targetStem?.freq || (stemType === 'drums' ? 120 : stemType === 'bass' ? 65 : 196);
      const waveType = targetStem?.waveType || (stemType === 'drums' ? 'square' : 'sawtooth');

      // Play isolated authentic stem preview with physical modeling synthesis & track key
      audioMiniDaw.startPlayback(
        [
          {
            id: targetStem?.id || 1,
            name: targetStem?.name || 'Stem Preview',
            vol: 92,
            pan: 0,
            muted: false,
            solo: true,
            trimIn: 0,
            trimOut: 120,
            freq,
            waveType,
            stemType: stemType as any,
            color: targetStem?.color || '#06b6d4',
            audioUrl: targetStem?.audioUrl,
            webdavPath: targetStem?.webdavPath
          }
        ],
        selectedTrack.bpm || 80,
        selectedTrack.key || 'G Major'
      );
      setPlayingStemId(stemId);
    }
  };

  const handleOpenCreateSession = () => {
    const defaultName = `${selectedTrack.title} — Iteration #${sessions.filter((s) => s.trackId === selectedTrack.id).length + 1}`;
    setNewSessionName(defaultName);
    setNewSessionDesc(`Snapshot session for ${selectedTrack.title} (${selectedTrack.id}) in ${selectedTrack.ep}.`);
    setNewSessionTags([selectedTrack.genre.split('/')[0]?.trim() || 'Worship', 'Suno v5.5 Pass']);
    setNewSessionPinned(false);
    setIsCreatingSession(true);
  };

  const handleSubmitNewSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSessionName.trim()) return;
    await onSaveCurrentSession(newSessionName, newSessionDesc, newSessionTags, newSessionPinned);
    setIsCreatingSession(false);
  };

  const [sidebarHoverItem, setSidebarHoverItem] = useState<{
    item: StudioNavItem;
    rect: DOMRect;
  } | null>(null);

  if (isCollapsed) {
    return (
      <aside className={`w-18 sm:w-20 border-r flex flex-col items-center py-3.5 space-y-3 h-full flex-shrink-0 z-30 shadow-xl transition-all duration-200 overflow-y-auto custom-scrollbar ${
        isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
      }`}>
        {/* Expand Button */}
        <button
          onClick={onToggleCollapse}
          className={`p-2 rounded-xl transition cursor-pointer shadow-sm border ${
            isDarkMode
              ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700/50'
              : 'bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border-slate-300'
          }`}
          title="Expand Side Navigation Panel (Full View)"
        >
          <ChevronRight className="w-4 h-4 text-indigo-500" />
        </button>

        <div className={`h-px w-10 my-0.5 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'}`} />

        {/* Tab Quick Toggles: Projects, Sessions, Assets */}
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={() => {
              onSetActivePanelTab('projects');
              onToggleCollapse();
            }}
            className={`p-2 rounded-xl transition cursor-pointer relative ${
              activePanelTab === 'projects'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/60'
                : isDarkMode
                ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
            title={`Projects Catalog (${tracks.length} Master Tracks) — Click to expand`}
          >
            <Disc className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-indigo-400" />
          </button>

          <button
            onClick={() => {
              onSetActivePanelTab('sessions');
              onToggleCollapse();
            }}
            className={`p-2 rounded-xl transition cursor-pointer relative ${
              activePanelTab === 'sessions'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-950/60'
                : isDarkMode
                ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
            title={`Composition Sessions (${sessions.length} Snapshots) — Click to expand`}
          >
            <FolderKanban className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-purple-400" />
          </button>

          <button
            onClick={() => {
              onSetActivePanelTab('assets');
              onToggleCollapse();
            }}
            className={`p-2 rounded-xl transition cursor-pointer relative ${
              activePanelTab === 'assets'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950/60'
                : isDarkMode
                ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
            title="Studio Assets (Stems, Artworks, Video Reels) — Click to expand"
          >
            <HardDrive className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400" />
          </button>
        </div>

        <div className={`h-px w-10 my-0.5 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'}`} />

        {/* TWO-COLUMN / TWO-ROW QUICK LAUNCHER ICONS (TIER 1 & TIER 2) */}
        <div className="w-full px-1.5 flex flex-col items-center space-y-1.5">
          <div className={`flex items-center justify-between w-full px-1 text-[8px] font-mono uppercase font-black ${
            isDarkMode ? 'text-slate-500' : 'text-slate-400'
          }`}>
            <span title="Tier 1: Audio Engine">T1</span>
            <span title="Tier 2: Visuals & Copilots">T2</span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 w-full">
            {/* Col 1: Tier 1 Audio Icons */}
            <div className="flex flex-col gap-1.5 items-center">
              {visibleTier1Items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={`side-t1-${item.id}`}
                    onClick={() => onNavigateToTab(item.id)}
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setSidebarHoverItem({ item, rect });
                    }}
                    onMouseLeave={() => setSidebarHoverItem(null)}
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center transition cursor-pointer border relative group ${
                      isActive
                        ? `${item.activeBg} ${item.activeBorder} text-white shadow-md ring-2 ring-white/20`
                        : isDarkMode
                        ? 'bg-slate-950/80 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-white'
                        : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900 shadow-2xs'
                    }`}
                    title={`${item.name} (${item.tierLabel}): ${item.description}`}
                    aria-label={item.name}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : item.accentColor}`} />
                    {isActive && (
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-400 border border-slate-950 animate-pulse" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Col 2: Tier 2 Visuals Icons */}
            <div className="flex flex-col gap-1.5 items-center">
              {visibleTier2Items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={`side-t2-${item.id}`}
                    onClick={() => onNavigateToTab(item.id)}
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setSidebarHoverItem({ item, rect });
                    }}
                    onMouseLeave={() => setSidebarHoverItem(null)}
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center transition cursor-pointer border relative group ${
                      isActive
                        ? `${item.activeBg} ${item.activeBorder} text-white shadow-md ring-2 ring-white/20`
                        : isDarkMode
                        ? 'bg-slate-950/80 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-white'
                        : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900 shadow-2xs'
                    }`}
                    title={`${item.name} (${item.tierLabel}): ${item.description}`}
                    aria-label={item.name}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : item.accentColor}`} />
                    {isActive && (
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-400 border border-slate-950 animate-pulse" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* SIDEBAR FLOATING HOVER CARD */}
        {sidebarHoverItem && (
          <div
            style={{
              position: 'fixed',
              left: `${sidebarHoverItem.rect.right + 12}px`,
              top: `${Math.min(Math.max(sidebarHoverItem.rect.top - 20, 16), typeof window !== 'undefined' ? window.innerHeight - 260 : 300)}px`,
              zIndex: 9999
            }}
            className="w-[320px] pointer-events-none animate-in fade-in zoom-in-95 duration-150"
          >
            <div className={`p-3.5 rounded-2xl shadow-2xl border backdrop-blur-xl relative transition-all ${
              isDarkMode
                ? 'bg-slate-900/95 border-slate-700/80 text-white shadow-indigo-950/80 ring-1 ring-white/10'
                : 'bg-white/95 border-slate-300 text-slate-900 shadow-xl ring-1 ring-slate-900/10'
            }`}>
              {/* Arrow pointing left back to the icon */}
              <div className={`absolute left-[-6px] top-6 w-3 h-3 rotate-45 border-l border-b transition-all ${
                isDarkMode
                  ? 'border-slate-700/80 bg-slate-900'
                  : 'border-slate-300 bg-white'
              }`} />

              <div className="flex items-start gap-2.5 mb-2 relative z-10">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
                  activeTab === sidebarHoverItem.item.id
                    ? `${sidebarHoverItem.item.activeBg} text-white`
                    : isDarkMode
                    ? 'bg-slate-800 text-indigo-400 border border-slate-700'
                    : 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                }`}>
                  {React.createElement(sidebarHoverItem.item.icon, { className: 'w-4 h-4' })}
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-black tracking-wide truncate">
                    {sidebarHoverItem.item.name}
                  </h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border font-semibold ${sidebarHoverItem.item.tierBadgeColor}`}>
                      {sidebarHoverItem.item.tierLabel}
                    </span>
                    {activeTab === sidebarHoverItem.item.id && (
                      <span className="flex items-center gap-1 text-[9px] font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.2 rounded border border-amber-400/30 font-mono">
                        <CheckCircle2 className="w-3 h-3 text-amber-400" />
                        ACTIVE
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <p className={`text-[11px] leading-relaxed mb-2 relative z-10 ${
                isDarkMode ? 'text-slate-300' : 'text-slate-600'
              }`}>
                {sidebarHoverItem.item.description}
              </p>

              {sidebarHoverItem.item.sopRule && (
                <div className={`p-2 rounded-xl border text-[10px] leading-tight flex items-start gap-1.5 mb-2 relative z-10 ${
                  isDarkMode
                    ? 'bg-amber-950/40 border-amber-800/40 text-amber-300'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}>
                  <span className="font-bold">SOP:</span>
                  <span>{sidebarHoverItem.item.sopRule}</span>
                </div>
              )}

              <div className={`pt-2 border-t flex items-center justify-between text-[10px] font-mono relative z-10 ${
                isDarkMode ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'
              }`}>
                <span className="text-indigo-400 font-bold flex items-center gap-1">
                  <ArrowRight className="w-3 h-3" />
                  <span>Click to open workspace</span>
                </span>
                {sidebarHoverItem.item.shortcut && (
                  <span className={`px-1.5 py-0.5 rounded border font-bold ${
                    isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-300 text-slate-700'
                  }`}>
                    {sidebarHoverItem.item.shortcut}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </aside>
    );
  }

  return (
    <aside
      className={`w-80 sm:w-92 border-r flex flex-col h-full overflow-hidden flex-shrink-0 z-30 shadow-2xl transition-all duration-200 ${
        isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
      }`}
    >
      
      {/* HEADER: TITLE, TAB SWITCHER & PIN/COLLAPSE */}
      <div className={`p-3.5 border-b space-y-3 ${isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-700/60 p-0.5 flex items-center justify-center shadow-md overflow-hidden">
              <img src="/brick-logo.webp" alt="brickOS Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h2 className={`text-xs font-black uppercase tracking-wider ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Studio Side Nav</h2>
              <p className={`text-[10px] font-mono ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Projects, Sessions & Assets</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onToggleCollapse}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                isDarkMode ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200'
              }`}
              title="Collapse Side Navigation Panel"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className={`p-1.5 rounded-lg transition cursor-pointer lg:hidden ${
                  isDarkMode ? 'text-slate-400 hover:text-rose-400 hover:bg-slate-800' : 'text-slate-500 hover:text-rose-600 hover:bg-slate-200'
                }`}
                title="Close drawer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* 3-WAY SUB-TAB NAVIGATION */}
        <div className={`grid grid-cols-3 gap-1 p-1 rounded-xl border text-[11px] font-bold ${
          isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
        }`}>
          <button
            type="button"
            onClick={() => onSetActivePanelTab('projects')}
            className={`py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activePanelTab === 'projects'
                ? 'bg-indigo-600 text-white shadow-sm'
                : isDarkMode
                ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
          >
            <Disc className="w-3.5 h-3.5 text-indigo-400" />
            <span>Projects ({tracks.length})</span>
          </button>

          <button
            type="button"
            onClick={() => onSetActivePanelTab('sessions')}
            className={`py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activePanelTab === 'sessions'
                ? 'bg-purple-600 text-white shadow-sm'
                : isDarkMode
                ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
          >
            <FolderKanban className="w-3.5 h-3.5 text-purple-400" />
            <span>Sessions ({sessions.length})</span>
          </button>

          <button
            type="button"
            onClick={() => onSetActivePanelTab('assets')}
            className={`py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activePanelTab === 'assets'
                ? 'bg-cyan-600 text-white shadow-sm'
                : isDarkMode
                ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
            <span>Assets</span>
          </button>
        </div>

        {/* Stem Download Notice Banner */}
        {downloadNotice && (
          <div className="p-2 rounded-xl bg-cyan-600 text-white font-mono text-[10px] font-bold shadow-md flex items-center justify-between gap-1 animate-fadeIn">
            <span>{downloadNotice}</span>
            <button onClick={() => setDownloadNotice(null)} className="hover:opacity-75 cursor-pointer">✕</button>
          </div>
        )}
      </div>

      {/* CONTENT AREA BASED ON ACTIVE TAB */}
      <div className={`flex-1 overflow-y-auto custom-scrollbar p-3.5 space-y-3.5 ${
        isDarkMode ? 'bg-slate-900/40' : 'bg-slate-50/50'
      }`}>
        
        {/* ======================================================== */}
        {/* TAB 1: SAVED MUSICAL PROJECTS (CATALOG) - SELECTOR 2     */}
        {/* ======================================================== */}
        {activePanelTab === 'projects' && (
          <div className="space-y-3">
            {/* Search & Add New Project */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search 26+ tracks, genre, vocals..."
                  value={projectSearch}
                  onChange={(e) => setProjectSearch(e.target.value)}
                  className={`w-full border rounded-xl pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500 transition ${
                    isDarkMode
                      ? 'bg-slate-950 border-slate-800 text-slate-200 placeholder-slate-500'
                      : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>
              <button
                onClick={onAddNewTrack}
                className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 shadow transition cursor-pointer flex-shrink-0"
                title="Create New Project Track"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New</span>
              </button>
            </div>

            {/* EP Suite Filter Chips */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 custom-scrollbar text-[10px] font-bold">
              <button
                onClick={() => setProjectEpFilter('ALL')}
                className={`px-2 py-0.5 rounded-lg transition whitespace-nowrap cursor-pointer ${
                  projectEpFilter === 'ALL'
                    ? 'bg-indigo-600 text-white'
                    : isDarkMode
                    ? 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                All EPs ({tracks.length})
              </button>
              {EP_COLLECTIONS.map((ep) => (
                <button
                  key={ep.id}
                  onClick={() => setProjectEpFilter(ep.title)}
                  className={`px-2 py-0.5 rounded-lg transition whitespace-nowrap cursor-pointer ${
                    projectEpFilter === ep.title
                      ? 'bg-indigo-600 text-white'
                      : isDarkMode
                      ? 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {ep.title.replace('The ', '')}
                </button>
              ))}
            </div>

            {/* Track Listing */}
            <div className="space-y-1.5">
              {filteredProjects.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500 font-mono">
                  No projects match your filter.
                </div>
              ) : (
                filteredProjects.map((track) => {
                  const isSelected = selectedTrack.id === track.id;
                  const trackSessionCount = sessions.filter((s) => s.trackId === track.id).length;

                  return (
                    <div
                      key={track.id}
                      onClick={() => onSelectTrack(track)}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer group ${
                        isSelected
                          ? isDarkMode
                            ? 'bg-indigo-950/60 border-indigo-500/80 shadow-md shadow-indigo-950/50'
                            : 'bg-indigo-50/80 border-indigo-400 shadow-sm'
                          : isDarkMode
                          ? 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/80'
                          : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono text-[10px] font-bold text-indigo-500 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/30">
                              {track.id}
                            </span>
                            <span className={`font-bold text-xs truncate max-w-[160px] ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                              {track.title}
                            </span>
                            {isSelected && (
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Active on workbench" />
                            )}
                          </div>
                          <p className={`text-[10px] truncate ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            {track.ep} • {track.genre}
                          </p>
                        </div>

                        <div className="text-right space-y-1 flex-shrink-0">
                          <span
                            className={`inline-block text-[9px] font-bold font-mono px-1.5 py-0.5 rounded ${
                              track.status === 'Released'
                                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30'
                                : track.status === 'Audio Master'
                                ? 'bg-purple-500/10 text-purple-500 border border-purple-500/30'
                                : track.status === 'UVR5 Stem Prep'
                                ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30'
                                : isDarkMode
                                ? 'bg-slate-800 text-slate-300 border border-slate-700'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {track.status}
                          </span>
                          <div className="text-[9px] font-mono text-slate-400">
                            {track.bpm} BPM • {track.key}
                          </div>
                        </div>
                      </div>

                      {/* Bottom row: Sessions count and Selah status */}
                      <div className={`mt-2 pt-1.5 border-t flex items-center justify-between text-[10px] ${
                        isDarkMode ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-500'
                      }`}>
                        <span className="truncate max-w-[170px] italic">
                          {track.vocalCast || track.vocal}
                        </span>
                        <div className="flex items-center gap-2">
                          {trackSessionCount > 0 && (
                            <span className="text-purple-400 font-mono text-[9px]">
                              {trackSessionCount} sess
                            </span>
                          )}
                          {track.selahPrayed && (
                            <span className="text-emerald-400 flex items-center gap-0.5 text-[9px]">
                              <Heart className="w-2.5 h-2.5 fill-emerald-400" /> Selah
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: COMPOSITION SESSIONS */}
        {/* ======================================================== */}
        {activePanelTab === 'sessions' && (
          <div className="space-y-3">
            {/* Session Search & Create Snapshot Button */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search session snapshots..."
                    value={sessionSearch}
                    onChange={(e) => setSessionSearch(e.target.value)}
                    className={`w-full border rounded-xl pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-purple-500 transition ${
                      isDarkMode
                        ? 'bg-slate-950 border-slate-800 text-slate-200 placeholder-slate-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>
                <button
                  onClick={handleOpenCreateSession}
                  className="px-2.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1 shadow transition cursor-pointer flex-shrink-0"
                  title="Save current workbench as new session"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Snapshot</span>
                </button>
              </div>

              {/* Filter chips: All, Current Track, Pinned */}
              <div className="flex items-center gap-1 text-[10px] font-bold">
                <button
                  onClick={() => setSessionFilterMode('all')}
                  className={`px-2 py-0.5 rounded-lg transition cursor-pointer ${
                    sessionFilterMode === 'all'
                      ? 'bg-purple-600 text-white'
                      : isDarkMode
                      ? 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({sessions.length})
                </button>
                <button
                  onClick={() => setSessionFilterMode('current_track')}
                  className={`px-2 py-0.5 rounded-lg transition cursor-pointer ${
                    sessionFilterMode === 'current_track'
                      ? 'bg-purple-600 text-white'
                      : isDarkMode
                      ? 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {selectedTrack.id} Only ({sessions.filter((s) => s.trackId === selectedTrack.id).length})
                </button>
                <button
                  onClick={() => setSessionFilterMode('pinned')}
                  className={`px-2 py-0.5 rounded-lg transition flex items-center gap-1 cursor-pointer ${
                    sessionFilterMode === 'pinned'
                      ? 'bg-purple-600 text-white'
                      : isDarkMode
                      ? 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Pin className="w-2.5 h-2.5" />
                  <span>Pinned ({sessions.filter((s) => s.isPinned).length})</span>
                </button>
              </div>
            </div>

            {/* Quick Create Form Modal */}
            {isCreatingSession && (
              <form onSubmit={handleSubmitNewSession} className={`border rounded-xl p-3 space-y-2.5 shadow-xl animate-fadeIn ${
                isDarkMode ? 'bg-slate-950 border-purple-600/50' : 'bg-white border-purple-300'
              }`}>
                <div className={`flex items-center justify-between text-xs font-bold border-b pb-1.5 ${
                  isDarkMode ? 'text-white border-slate-800' : 'text-slate-900 border-slate-200'
                }`}>
                  <span className="text-purple-600 dark:text-purple-300">Save Composition Session</span>
                  <button type="button" onClick={() => setIsCreatingSession(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">✕</button>
                </div>
                <div>
                  <label className="block text-[9px] font-mono uppercase text-slate-400 mb-0.5">Session Name</label>
                  <input
                    type="text"
                    value={newSessionName}
                    onChange={(e) => setNewSessionName(e.target.value)}
                    className={`w-full rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-purple-500 border ${
                      isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                    placeholder="e.g. Master's Hand - Bridge Rework"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-mono uppercase text-slate-400 mb-0.5">Description / Intent</label>
                  <input
                    type="text"
                    value={newSessionDesc}
                    onChange={(e) => setNewSessionDesc(e.target.value)}
                    className={`w-full rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-purple-500 border ${
                      isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                    placeholder="Notes on this iteration..."
                  />
                </div>
                <div className="flex items-center justify-between pt-1">
                  <label className={`flex items-center gap-1.5 text-[10px] cursor-pointer ${
                    isDarkMode ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    <input
                      type="checkbox"
                      checked={newSessionPinned}
                      onChange={(e) => setNewSessionPinned(e.target.checked)}
                      className="rounded text-purple-600"
                    />
                    <span>Pin to top</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsCreatingSession(false)}
                      className={`px-2 py-1 rounded text-[10px] font-bold ${
                        isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold shadow"
                    >
                      Save Snapshot
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Sessions List */}
            <div className="space-y-1.5">
              {filteredSessions.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400 font-mono">
                  No sessions found. Create a snapshot to capture this composition state!
                </div>
              ) : (
                filteredSessions.map((session) => {
                  const isActive = activeSessionId === session.id;

                  return (
                    <div
                      key={session.id}
                      className={`p-2.5 rounded-xl border transition-all ${
                        isActive
                          ? isDarkMode
                            ? 'bg-purple-950/60 border-purple-500/80 shadow-md shadow-purple-950/50'
                            : 'bg-purple-50 border-purple-400 shadow-xs'
                          : isDarkMode
                          ? 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/80'
                          : 'bg-white border-slate-200 hover:border-purple-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <div
                          className="space-y-1 min-w-0 flex-1 cursor-pointer"
                          onClick={() => onSelectSession(session)}
                        >
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`font-bold text-xs truncate max-w-[170px] ${
                              isDarkMode ? 'text-white' : 'text-slate-900'
                            }`}>
                              {session.name}
                            </span>
                            {session.isPinned && <Pin className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />}
                          </div>
                          <p className={`text-[10px] truncate ${
                            isDarkMode ? 'text-purple-300/80' : 'text-purple-700'
                          }`}>
                            {session.trackTitle} ({session.trackId})
                          </p>
                        </div>

                        {/* Session Actions */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => onTogglePinSession(session)}
                            className={`p-1 rounded transition ${
                              isDarkMode ? 'text-slate-400 hover:text-amber-400 hover:bg-slate-800' : 'text-slate-400 hover:text-amber-600 hover:bg-slate-100'
                            }`}
                            title={session.isPinned ? 'Unpin' : 'Pin to top'}
                          >
                            <Pin className={`w-3 h-3 ${session.isPinned ? 'fill-amber-500 text-amber-500' : ''}`} />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDuplicateSession(session)}
                            className={`p-1 rounded transition ${
                              isDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'
                            }`}
                            title="Duplicate/Fork session"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteSession(session.id)}
                            className={`p-1 rounded transition ${
                              isDarkMode ? 'text-slate-400 hover:text-rose-400 hover:bg-slate-800' : 'text-slate-400 hover:text-rose-600 hover:bg-slate-100'
                            }`}
                            title="Delete session"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Snapshot details */}
                      <div
                        className={`mt-2 pt-1.5 border-t flex items-center justify-between text-[9px] font-mono cursor-pointer ${
                          isDarkMode ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-500'
                        }`}
                        onClick={() => onSelectSession(session)}
                      >
                        <div className="flex items-center gap-1.5">
                          <span>{session.snapshot?.bpm || 100} BPM</span>
                          <span>•</span>
                          <span>{session.snapshot?.key || 'C'}</span>
                          <span>•</span>
                          <span className="text-indigo-500">{session.snapshot?.latestVersionTag || 'v1.0'}</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectSession(session);
                          }}
                          className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            isActive
                              ? 'bg-purple-600 text-white'
                              : isDarkMode
                              ? 'bg-purple-900/60 hover:bg-purple-800 text-purple-200'
                              : 'bg-purple-100 hover:bg-purple-200 text-purple-800'
                          }`}
                        >
                          {isActive ? 'Active' : 'Switch'}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: MEDIA ASSETS & UVR5 STEM REPOSITORY               */}
        {/* ======================================================== */}
        {activePanelTab === 'assets' && (
          <div className="space-y-3.5">
            <div className={`p-2.5 rounded-xl border space-y-2 ${
              isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
                  <span className={`text-xs font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Track Asset Hub</span>
                </div>
                {/* Track Switcher Dropdown */}
                <select
                  value={selectedTrack.id}
                  onChange={(e) => {
                    const target = tracks.find(t => t.id === e.target.value);
                    if (target) onSelectTrack(target);
                  }}
                  className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border focus:outline-none cursor-pointer ${
                    isDarkMode
                      ? 'bg-slate-900 text-cyan-300 border-slate-700'
                      : 'bg-white text-cyan-800 border-slate-300'
                  }`}
                >
                  {tracks.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.id}: {t.title.length > 20 ? t.title.slice(0, 18) + '...' : t.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <p className={`text-[11px] font-bold truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{selectedTrack.title}</p>
                <p className={`text-[10px] font-mono truncate ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  {selectedTrack.ep} • {selectedTrack.bpm} BPM • {selectedTrack.key}
                </p>
              </div>

              {/* Nextcloud Live WebDAV Connection Service & Diagnostics Engine */}
              <div className={`p-2.5 rounded-xl border space-y-2 ${
                isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-100/90 border-slate-200'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold flex items-center gap-1.5">
                    <Activity className={`w-3.5 h-3.5 ${
                      ncConnectionStatus === 'connected' ? 'text-emerald-400' :
                      ncConnectionStatus === 'unauthorized' ? 'text-amber-400' :
                      ncConnectionStatus === 'error' ? 'text-rose-400' : 'text-slate-400'
                    }`} />
                    <span>Nextcloud WebDAV Bridge</span>
                  </span>

                  {/* Status Badge */}
                  <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                    ncConnectionStatus === 'connected'
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/50'
                      : ncConnectionStatus === 'unauthorized'
                      ? 'bg-amber-950/80 text-amber-300 border-amber-700/50'
                      : ncConnectionStatus === 'error'
                      ? 'bg-rose-950/80 text-rose-300 border-rose-700/50'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    {ncConnectionStatus === 'connected' && `ONLINE • ${ncPingMs || 0}ms`}
                    {ncConnectionStatus === 'unauthorized' && 'HTTP 401: NEEDS APP PASSWORD'}
                    {ncConnectionStatus === 'error' && 'CONNECTION ERROR'}
                    {ncConnectionStatus === 'idle' && 'STANDBY'}
                  </span>
                </div>

                <div className="text-[10px] font-mono text-slate-400 break-all leading-tight">
                  Folder 207332: <span className="text-cyan-400">/Music-Production</span> ({ncConfig.username})
                </div>

                {/* Diagnostic summary banner if unauthorized or error */}
                {ncDiagnosticVerdict && (
                  <div className={`p-2 rounded-lg text-[10px] space-y-1 border ${
                    ncConnectionStatus === 'connected'
                      ? 'bg-emerald-950/40 border-emerald-800/40 text-emerald-300'
                      : ncConnectionStatus === 'unauthorized'
                      ? 'bg-amber-950/40 border-amber-800/40 text-amber-200'
                      : 'bg-rose-950/40 border-rose-800/40 text-rose-200'
                  }`}>
                    <p className="font-semibold leading-tight">{ncDiagnosticVerdict}</p>
                    {ncRecommendedAction && (
                      <p className="text-[9px] opacity-90 leading-tight pt-0.5 border-t border-white/10">
                        👉 {ncRecommendedAction}
                      </p>
                    )}
                  </div>
                )}

                {/* Quick App Password Credential Bar */}
                <div className="space-y-1.5 pt-0.5">
                  <div className="flex items-center gap-1">
                    <div className="relative flex-1">
                      <input
                        type={showNcPassword ? 'text' : 'password'}
                        value={ncAppPassword}
                        onChange={(e) => setNcAppPassword(e.target.value)}
                        placeholder="Paste Nextcloud App Password..."
                        className={`w-full px-2 py-1 pr-6 rounded-lg text-[10px] font-mono border focus:outline-hidden focus:ring-1 focus:ring-cyan-500 ${
                          isDarkMode ? 'bg-slate-950 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNcPassword(!showNcPassword)}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                        title={showNcPassword ? 'Hide password' : 'Show password'}
                      >
                        {showNcPassword ? <Unlock className="w-2.5 h-2.5" /> : <Lock className="w-2.5 h-2.5" />}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={handleSaveNcPassword}
                      disabled={isTestingNc}
                      className="px-2 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-[10px] font-bold transition flex items-center gap-1 cursor-pointer flex-shrink-0"
                      title="Save App Password and Test Connection"
                    >
                      {isTestingNc ? <RefreshCw className="w-2.5 h-2.5 animate-spin" /> : <Check className="w-2.5 h-2.5" />}
                      <span>Save & Link</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono">
                    <a
                      href={`${ncConfig.serverUrl || 'https://nextcloud.mermaid-symmetric.ts.net'}/index.php/settings/user/security`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:underline flex items-center gap-0.5"
                    >
                      <span>Generate App Password</span>
                      <ExternalLink className="w-2 h-2" />
                    </a>
                    <span>User: ncted</span>
                  </div>
                </div>

                {/* Action Buttons: Sync Live Assets, Test Connection & View Diagnostic Logs */}
                <div className="space-y-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => onNavigateToTab('nextcloud_sync')}
                    className="w-full py-1.5 px-3 rounded-lg bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-[10px] transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    title="Open full interactive Nextcloud WebDAV File Explorer with audio auditioning, stem upload & folder management"
                  >
                    <Folder className="w-3 h-3 text-cyan-200" />
                    <span>Open WebDAV File Explorer</span>
                    <ArrowRight className="w-3 h-3 text-cyan-200" />
                  </button>

                  <button
                    type="button"
                    onClick={handleSyncNcAssets}
                    disabled={isSyncingNcAssets}
                    className="w-full py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-slate-950 font-bold text-[10px] transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    title="Query Nextcloud WebDAV and sync all live assets for project catalog"
                  >
                    <Zap className={`w-3 h-3 text-slate-950 ${isSyncingNcAssets ? 'animate-bounce' : ''}`} />
                    <span>{isSyncingNcAssets ? 'Querying WebDAV & Syncing Assets...' : '⚡ Sync Live WebDAV Assets Now'}</span>
                  </button>

                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={handleTestNcConnection}
                      disabled={isTestingNc}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition flex items-center justify-center gap-1 cursor-pointer ${
                        isDarkMode
                          ? 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border-cyan-800/40'
                          : 'bg-white hover:bg-slate-50 text-cyan-700 border-slate-300'
                      }`}
                    >
                      <RefreshCw className={`w-2.5 h-2.5 text-cyan-400 ${isTestingNc ? 'animate-spin' : ''}`} />
                      <span>{isTestingNc ? 'Testing...' : 'Test WebDAV'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowDiagnosticLogs(!showDiagnosticLogs);
                        if (!showDiagnosticLogs) fetchNcLogs();
                      }}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition flex items-center justify-center gap-1 cursor-pointer ${
                        showDiagnosticLogs
                          ? 'bg-indigo-600 text-white border-indigo-500'
                          : isDarkMode
                          ? 'bg-slate-800 hover:bg-slate-700 text-indigo-300 border-indigo-800/40'
                          : 'bg-white hover:bg-slate-50 text-indigo-700 border-slate-300'
                      }`}
                    >
                      <Terminal className="w-2.5 h-2.5 text-indigo-400" />
                      <span>Logs ({ncDiagnosticLogs.length})</span>
                      {showDiagnosticLogs ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
                    </button>
                  </div>

                  {/* Sync success toast notification */}
                  {ncSyncSuccessMsg && (
                    <div className="p-2 rounded-lg bg-emerald-950/70 border border-emerald-500/50 text-emerald-200 text-[10px] font-bold flex items-center justify-between animate-fadeIn">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{ncSyncSuccessMsg}</span>
                      </span>
                      <button
                        onClick={() => setNcSyncSuccessMsg(null)}
                        className="text-emerald-400 hover:text-white text-xs cursor-pointer ml-1"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>

                {/* EXPANDABLE WEBDAV DIAGNOSTIC LOG CONSOLE */}
                {showDiagnosticLogs && (
                  <div className={`p-2 rounded-xl border space-y-2 animate-fadeIn text-[10px] font-mono ${
                    isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-900 text-slate-100 border-slate-800'
                  }`}>
                    <div className="flex items-center justify-between text-[9px] pb-1 border-b border-slate-800">
                      <span className="text-cyan-400 font-bold flex items-center gap-1">
                        <Terminal className="w-3 h-3" />
                        <span>Live WebDAV Diagnostic Trace</span>
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={handleCopyDiagnostics}
                          className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition text-[8px]"
                          title="Copy full diagnostic report as JSON"
                        >
                          {ncCopySuccess ? '✓ Copied' : 'Copy'}
                        </button>
                        <button
                          type="button"
                          onClick={handleClearNcLogs}
                          className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 transition text-[8px]"
                          title="Clear logs"
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    <div className="max-h-48 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
                      {ncDiagnosticLogs.length === 0 ? (
                        <div className="text-slate-500 py-2 text-center text-[9px]">
                          No logs recorded yet. Click "Test WebDAV" above to generate a trace.
                        </div>
                      ) : (
                        ncDiagnosticLogs.slice(0, 15).map((logItem) => (
                          <div
                            key={logItem.id}
                            className={`p-1.5 rounded border text-[9px] leading-tight ${
                              logItem.level === 'success'
                                ? 'bg-emerald-950/60 border-emerald-800/40 text-emerald-300'
                                : logItem.level === 'warn'
                                ? 'bg-amber-950/60 border-amber-800/40 text-amber-200'
                                : logItem.level === 'error'
                                ? 'bg-rose-950/60 border-rose-800/40 text-rose-300'
                                : 'bg-slate-900 border-slate-800 text-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1 opacity-75 text-[8px]">
                              <span>[{logItem.stage}] {logItem.action}</span>
                              <span>{logItem.timestamp.split('T')[1]?.slice(0, 8)}</span>
                            </div>
                            <div className="font-sans mt-0.5">{logItem.message}</div>
                            {logItem.details && (
                              <div className="mt-1 text-[8px] opacity-80 overflow-x-auto text-slate-400">
                                {logItem.details.status && `Status: HTTP ${logItem.details.status} • `}
                                {logItem.details.cloudflareDetected && 'Cloudflare: Detected • '}
                                {logItem.details.sabreException && `SabreDAV: ${logItem.details.sabreException}`}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => onNavigateToTab('nextcloud_sync')}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition flex items-center justify-center gap-1 cursor-pointer ${
                    isDarkMode
                      ? 'bg-slate-900 hover:bg-slate-800 text-emerald-300 border-emerald-800/40'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                  }`}
                  title="Open Nextcloud Live Sync & WebDAV Diagnostic Console"
                >
                  <RefreshCw className="w-2.5 h-2.5 text-emerald-400" />
                  <span>Nextcloud Sync</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateToTab('mixer')}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition flex items-center justify-center gap-1 cursor-pointer ${
                    isDarkMode
                      ? 'bg-slate-900 hover:bg-slate-800 text-cyan-300 border-cyan-800/40'
                      : 'bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border-cyan-200'
                  }`}
                  title="Open Multi-Track Mini DAW Mixer"
                >
                  <Music className="w-2.5 h-2.5 text-cyan-400" />
                  <span>DAW Mixer</span>
                </button>
              </div>

              {/* + Add New Asset Button */}
              <button
                type="button"
                onClick={() => handleOpenAddAsset('image')}
                className="w-full py-1.5 px-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add New Studio Asset</span>
              </button>
            </div>

            {/* Asset Category Filter Chips */}
            <div className="flex items-center gap-1 overflow-x-auto text-[10px] font-bold pb-1 custom-scrollbar">
              <button
                onClick={() => setAssetFilter('all')}
                className={`px-2 py-0.5 rounded-lg transition cursor-pointer ${
                  assetFilter === 'all'
                    ? 'bg-cyan-600 text-white'
                    : isDarkMode
                    ? 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setAssetFilter('stems')}
                className={`px-2 py-0.5 rounded-lg transition cursor-pointer ${
                  assetFilter === 'stems'
                    ? 'bg-cyan-600 text-white'
                    : isDarkMode
                    ? 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                Stems ({customStems.length})
              </button>
              <button
                onClick={() => setAssetFilter('nextcloud')}
                className={`px-2 py-0.5 rounded-lg transition cursor-pointer ${
                  assetFilter === 'nextcloud'
                    ? 'bg-cyan-600 text-white'
                    : isDarkMode
                    ? 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                Nextcloud ({ncAssets.length})
              </button>
              <button
                onClick={() => setAssetFilter('lyrics')}
                className={`px-2 py-0.5 rounded-lg transition cursor-pointer ${
                  assetFilter === 'lyrics'
                    ? 'bg-cyan-600 text-white'
                    : isDarkMode
                    ? 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                Lyrics ({selectedTrack.versions.length})
              </button>
              <button
                onClick={() => setAssetFilter('visuals')}
                className={`px-2 py-0.5 rounded-lg transition cursor-pointer ${
                  assetFilter === 'visuals'
                    ? 'bg-cyan-600 text-white'
                    : isDarkMode
                    ? 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                Art ({generatedImages.length})
              </button>
              <button
                onClick={() => setAssetFilter('videos')}
                className={`px-2 py-0.5 rounded-lg transition cursor-pointer ${
                  assetFilter === 'videos'
                    ? 'bg-cyan-600 text-white'
                    : isDarkMode
                    ? 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                Veo ({generatedVideos.length})
              </button>
            </div>

            {/* Section 1: UVR5 Lossless Audio Stems */}
            {(assetFilter === 'all' || assetFilter === 'stems') && (
              <div className="space-y-1.5">
                <div className={`flex items-center justify-between text-[11px] font-bold ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  <span className="flex items-center gap-1.5">
                    <Music className="w-3.5 h-3.5 text-cyan-500" />
                    <span>UVR5 Isolated Stems ({customStems.length})</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenAddAsset('stem')}
                      className="px-2 py-0.5 rounded text-[10px] bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                      title="Add new audio stem"
                    >
                      <Plus className="w-2.5 h-2.5" />
                      <span>Add</span>
                    </button>
                    <button
                      onClick={() => onNavigateToTab('mixer')}
                      className="text-[10px] text-cyan-500 hover:text-cyan-600 font-mono font-bold"
                    >
                      DAW →
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  {customStems.map((stem) => (
                    <div
                      key={stem.id}
                      className={`p-2 rounded-xl border flex items-center justify-between text-xs transition ${
                        isDarkMode
                          ? 'bg-slate-950 border-slate-800 hover:border-slate-700'
                          : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                      }`}
                    >
                      <div className="space-y-0.5 min-w-0 pr-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`font-bold text-[11px] truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                            {stem.name}
                          </span>
                          {stem.linkedTrackIds && stem.linkedTrackIds.length > 0 && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-950 border border-emerald-800/40 text-emerald-300 font-bold flex items-center gap-0.5">
                              <LinkIcon className="w-2 h-2" />
                              <span>+{stem.linkedTrackIds.length}</span>
                            </span>
                          )}
                        </div>
                        <div className="text-[9px] font-mono text-slate-400 flex items-center gap-1.5">
                          <span>{stem.format}</span>
                          <span>•</span>
                          <span>{stem.size}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => handleTogglePlayStem(stem.id)}
                          className={`p-1.5 rounded-lg transition cursor-pointer ${
                            playingStemId === stem.id
                              ? 'bg-cyan-500 text-slate-950 font-bold'
                              : isDarkMode
                              ? 'bg-slate-800 hover:bg-slate-700 text-cyan-300'
                              : 'bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border border-cyan-200'
                          }`}
                          title={playingStemId === stem.id ? 'Pause Preview' : 'Audition Stem Preview'}
                        >
                          {playingStemId === stem.id ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEditStem(stem)}
                          className={`p-1.5 rounded-lg transition ${
                            isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                          title="Edit stem name, format, reassign or link to other projects"
                        >
                          <Edit3 className="w-3 h-3 text-indigo-400" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteAssetFromModal(String(stem.id))}
                          className={`p-1.5 rounded-lg transition ${
                            isDarkMode ? 'bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400' : 'bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600'
                          }`}
                          title="Delete stem asset"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section 1b: Nextcloud Canonical WebDAV Assets (/Music-Production) */}
            {(assetFilter === 'all' || assetFilter === 'nextcloud') && (
              <div className={`space-y-1.5 pt-2 border-t ${
                isDarkMode ? 'border-slate-800/80' : 'border-slate-200'
              }`}>
                <div className={`flex items-center justify-between text-[11px] font-bold ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  <span className="flex items-center gap-1.5">
                    <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Nextcloud WebDAV Files ({ncAssets.length})</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handleAutoLinkAllTrackAssets}
                      className="text-[10px] text-cyan-400 hover:text-cyan-300 font-mono font-bold cursor-pointer px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/40 hover:bg-cyan-900/60"
                      title="Link all Nextcloud assets to current track"
                    >
                      🔗 Link All
                    </button>
                    <button
                      type="button"
                      onClick={handleSyncNcAssets}
                      disabled={isSyncingNcAssets}
                      className="text-[10px] text-emerald-400 hover:text-emerald-300 font-mono font-bold cursor-pointer px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/40 hover:bg-emerald-900/60 flex items-center gap-1"
                      title="Sync live files from WebDAV"
                    >
                      <RefreshCw className={`w-2.5 h-2.5 ${isSyncingNcAssets ? 'animate-spin' : ''}`} />
                      <span>Sync</span>
                    </button>
                    <button
                      onClick={() => onNavigateToTab('nextcloud_sync')}
                      className="text-[10px] text-slate-400 hover:text-slate-200 font-mono font-bold cursor-pointer ml-1"
                    >
                      Bento →
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  {ncAssets.map((asset) => {
                    const isLinked = (asset.linkedTrackIds && asset.linkedTrackIds.includes(selectedTrack.id)) || asset.matchedTrackId === selectedTrack.id || asset.isMatched;
                    const isAudio = asset.category.includes('AUDIO') || asset.category.includes('STEM');
                    const isPlayingThis = playingNcAssetId === asset.id;

                    return (
                      <div
                        key={asset.id}
                        className={`p-2 rounded-xl border flex items-center justify-between text-xs transition ${
                          isDarkMode
                            ? 'bg-slate-950 border-slate-800 hover:border-slate-700'
                            : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                        }`}
                      >
                        <div className="space-y-0.5 min-w-0 pr-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`font-bold text-[11px] truncate max-w-[170px] ${
                              isDarkMode ? 'text-white' : 'text-slate-900'
                            }`} title={asset.filename}>
                              {asset.filename}
                            </span>
                            <span className={`text-[8px] font-mono px-1 py-0.2 rounded font-bold border ${
                              asset.category === 'MASTER_AUDIO'
                                ? 'bg-amber-950 text-amber-300 border-amber-800/40'
                                : asset.category === 'UVR5_VOCAL_STEM'
                                ? 'bg-cyan-950 text-cyan-300 border-cyan-800/40'
                                : asset.category === 'LYRIC_SOP_DOC'
                                ? 'bg-indigo-950 text-indigo-300 border-indigo-800/40'
                                : 'bg-slate-800 text-slate-300 border-slate-700'
                            }`}>
                              {asset.category.replace('UVR5_', '').replace('_STEM', '').replace('_AUDIO', '')}
                            </span>
                            {isLinked && (
                              <span className="text-[8px] px-1 py-0.2 rounded bg-emerald-950 border border-emerald-800/40 text-emerald-300 font-bold flex items-center gap-0.5">
                                <CheckCircle2 className="w-2 h-2 text-emerald-400" />
                                <span>Linked</span>
                              </span>
                            )}
                          </div>
                          <div className="text-[9px] font-mono text-slate-400 flex items-center gap-1.5 truncate">
                            <span>{asset.fileSizeFormatted || '15 KB'}</span>
                            <span>•</span>
                            <span className="truncate max-w-[150px]">{asset.webdavPath || '/Music-Production'}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          {isAudio && (
                            <button
                              type="button"
                              onClick={() => handleTogglePlayNcAsset(asset)}
                              className={`p-1.5 rounded-lg transition cursor-pointer ${
                                isPlayingThis
                                  ? 'bg-emerald-500 text-slate-950 font-bold'
                                  : isDarkMode
                                  ? 'bg-slate-800 hover:bg-slate-700 text-emerald-300'
                                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                              }`}
                              title={isPlayingThis ? 'Pause Audio Preview' : 'Audition Stem Preview'}
                            >
                              {isPlayingThis ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleToggleLinkNcAsset(asset.id)}
                            className={`p-1.5 rounded-lg transition cursor-pointer ${
                              isLinked
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/50 hover:bg-rose-950 hover:text-rose-300'
                                : isDarkMode
                                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                            title={isLinked ? 'Click to Unlink from current track' : 'Link this Nextcloud asset to current track'}
                          >
                            <LinkIcon className="w-3 h-3" />
                          </button>
                          {asset.shareUrl && (
                            <a
                              href={asset.shareUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`p-1.5 rounded-lg transition ${
                                isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                              }`}
                              title="Open file in Nextcloud WebDAV"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Section 2: Lyric Versions & Checkpoints */}
            {(assetFilter === 'all' || assetFilter === 'lyrics') && (
              <div className={`space-y-1.5 pt-2 border-t ${
                isDarkMode ? 'border-slate-800/80' : 'border-slate-200'
              }`}>
                <div className={`flex items-center justify-between text-[11px] font-bold ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Saved Lyric Checkpoints ({selectedTrack.versions.length})</span>
                  </span>
                  <button
                    onClick={() => onNavigateToTab('lyrics')}
                    className="text-[10px] text-indigo-500 hover:text-indigo-600 font-mono font-bold"
                  >
                    Open Lyrics →
                  </button>
                </div>

                <div className="space-y-1.5">
                  {selectedTrack.versions.map((ver, idx) => (
                    <div
                      key={idx}
                      className={`p-2 rounded-xl border flex items-center justify-between text-xs transition ${
                        isDarkMode
                          ? 'bg-slate-950 border-slate-800 hover:border-slate-700'
                          : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                      }`}
                    >
                      <div className="space-y-0.5 min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-mono text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                            isDarkMode
                              ? 'text-indigo-300 bg-indigo-950 border-indigo-800/40'
                              : 'text-indigo-700 bg-indigo-50 border-indigo-200'
                          }`}>
                            {ver.version}
                          </span>
                          <span className={`text-[10px] font-medium truncate max-w-[140px] ${
                            isDarkMode ? 'text-white' : 'text-slate-900'
                          }`}>{ver.reason}</span>
                        </div>
                        <div className="text-[9px] font-mono text-slate-400">{ver.timestamp}</div>
                      </div>
                      <button
                        onClick={() => onNavigateToTab('lyrics')}
                        className={`px-2 py-1 rounded text-[9px] font-bold transition ${
                          isDarkMode
                            ? 'bg-slate-800 hover:bg-indigo-600 text-white'
                            : 'bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-700'
                        }`}
                      >
                        Inspect
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section 3: Visual & Cover Art Assets */}
            {(assetFilter === 'all' || assetFilter === 'visuals') && (
              <div className={`space-y-1.5 pt-2 border-t ${
                isDarkMode ? 'border-slate-800/80' : 'border-slate-200'
              }`}>
                <div className={`flex items-center justify-between text-[11px] font-bold ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  <span className="flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-purple-500" />
                    <span>Visuals & Cover Art ({generatedImages.length})</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenAddAsset('image')}
                      className="px-2 py-0.5 rounded text-[10px] bg-purple-600 hover:bg-purple-500 text-white font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                      title="Add new visual artwork"
                    >
                      <Plus className="w-2.5 h-2.5" />
                      <span>Add</span>
                    </button>
                    <button
                      onClick={() => onNavigateToTab('veo_visuals')}
                      className="text-[10px] text-purple-500 hover:text-purple-600 font-mono font-bold"
                    >
                      Open Studio →
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {generatedImages.map((img) => (
                    <div
                      key={img.id}
                      className={`group relative rounded-xl overflow-hidden border aspect-square cursor-pointer transition-all duration-200 ${
                        isDarkMode
                          ? 'border-slate-800 bg-slate-950 hover:border-purple-500/80 shadow-md ring-1 ring-purple-500/10'
                          : 'border-slate-200 bg-slate-100 hover:border-purple-400 shadow-xs'
                      }`}
                      onClick={() => handleOpenEditImage(img, 'edit')}
                    >
                      <img src={img.url} alt={img.prompt} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />

                      {/* Top badges */}
                      <div className="absolute top-1.5 inset-x-1.5 flex items-center justify-between pointer-events-none z-10">
                        <span className="px-1.5 py-0.2 rounded text-[8px] font-mono font-bold bg-black/75 backdrop-blur-xs text-white border border-white/10">
                          {img.aspectRatio || '1:1'}
                        </span>
                        {img.linkedTrackIds && img.linkedTrackIds.length > 0 && (
                          <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-emerald-600/90 text-white flex items-center gap-0.5 shadow-sm border border-emerald-400/40">
                            <LinkIcon className="w-2.5 h-2.5" />
                            <span>+{img.linkedTrackIds.length}</span>
                          </span>
                        )}
                      </div>

                      {/* Bottom static bar with track info and quick AI trigger */}
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-1.5 z-10 flex items-center justify-between text-[8px] text-white">
                        <span className="font-mono font-bold text-indigo-300 truncate max-w-[70px]">
                          {img.trackId || img.trackTitle || selectedTrack.id}
                        </span>
                        <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => handleOpenEditImage(img, 'gemini')}
                            className="p-1 rounded bg-purple-600/90 hover:bg-purple-500 text-amber-300 transition cursor-pointer shadow-xs"
                            title="Ask Gemini to change this image"
                          >
                            <Sparkles className="w-2.5 h-2.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditImage(img, 'edit')}
                            className="p-1 rounded bg-slate-800/90 hover:bg-slate-700 text-indigo-200 transition cursor-pointer"
                            title="Edit all aspects / reassign / link"
                          >
                            <Edit3 className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>

                      {/* Full hover action overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-black/20 opacity-0 group-hover:opacity-100 transition duration-200 p-2 flex flex-col justify-between text-[9px] text-white z-20">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => handleOpenEditImage(img, 'gemini')}
                            className="p-1 rounded bg-purple-600 hover:bg-purple-500 text-white transition cursor-pointer shadow flex items-center gap-1 text-[8px] font-bold"
                            title="Ask Gemini to change this image"
                          >
                            <Sparkles className="w-3 h-3 text-amber-300" />
                            <span>Ask Gemini</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditImage(img, 'edit')}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-white transition cursor-pointer"
                            title="Edit name, prompt, aspect ratio, reassign/link"
                          >
                            <Edit3 className="w-3 h-3 text-indigo-300" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAssetFromModal(img.id)}
                            className="p-1 rounded bg-rose-600/80 hover:bg-rose-600 text-white transition cursor-pointer"
                            title="Delete image asset"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>

                        <div>
                          <span className="font-bold truncate block text-[10px] text-white">
                            {img.name || img.trackTitle || selectedTrack.title}
                          </span>
                          <span className="text-slate-300 text-[8px] line-clamp-2 opacity-90">{img.prompt}</span>
                          <div className="flex items-center justify-between text-[8px] text-indigo-300 font-mono mt-1 pt-1 border-t border-white/10">
                            <span>{img.trackTitle || selectedTrack.id}</span>
                            <span className="text-amber-400 font-bold">Edit / AI →</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section 4: Veo 3 Video Generations */}
            {(assetFilter === 'all' || assetFilter === 'videos') && (
              <div className={`space-y-1.5 pt-2 border-t ${
                isDarkMode ? 'border-slate-800/80' : 'border-slate-200'
              }`}>
                <div className={`flex items-center justify-between text-[11px] font-bold ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  <span className="flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5 text-amber-500" />
                    <span>Veo 3 Video Generations ({generatedVideos.length})</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenAddAsset('video')}
                      className="px-2 py-0.5 rounded text-[10px] bg-amber-600 hover:bg-amber-500 text-white font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                      title="Add new video asset"
                    >
                      <Plus className="w-2.5 h-2.5" />
                      <span>Add</span>
                    </button>
                    <button
                      onClick={() => onNavigateToTab('veo_visuals')}
                      className="text-[10px] text-amber-500 hover:text-amber-600 font-mono font-bold"
                    >
                      Open Veo →
                    </button>
                  </div>
                </div>

                {generatedVideos.length === 0 ? (
                  <div className={`p-3 rounded-xl border text-center text-[10px] font-mono ${
                    isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-500'
                  }`}>
                    No Veo videos rendered for this project yet.
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {generatedVideos.map((vid) => (
                      <div
                        key={vid.id}
                        className={`p-2 rounded-xl border flex items-center justify-between text-xs ${
                          isDarkMode
                            ? 'bg-slate-950 border-slate-800 hover:border-slate-700'
                            : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[10px] font-bold truncate max-w-[150px] ${
                              isDarkMode ? 'text-white' : 'text-slate-900'
                            }`}>{vid.name || vid.prompt}</span>
                            {vid.linkedTrackIds && vid.linkedTrackIds.length > 0 && (
                              <span className="text-[8px] px-1 py-0.2 rounded bg-emerald-950 border border-emerald-800/40 text-emerald-300 font-bold">
                                +{vid.linkedTrackIds.length}
                              </span>
                            )}
                          </div>
                          <div className="text-[9px] font-mono text-amber-500">{vid.status.toUpperCase()} • {vid.aspectRatio}</div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditVideo(vid, 'gemini')}
                            className={`p-1.5 rounded text-[9px] font-bold ${
                              isDarkMode ? 'bg-purple-950 text-amber-300 hover:bg-purple-900' : 'bg-purple-50 text-purple-800 hover:bg-purple-100'
                            }`}
                            title="Ask Gemini to change this video prompt"
                          >
                            <Sparkles className="w-3 h-3 text-amber-400" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditVideo(vid, 'edit')}
                            className={`p-1.5 rounded text-[9px] font-bold ${
                              isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                            title="Edit video metadata & reassign/link"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAssetFromModal(vid.id)}
                            className={`p-1.5 rounded text-[9px] font-bold ${
                              isDarkMode ? 'bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400' : 'bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600'
                            }`}
                            title="Delete video"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Prompt Engineering Library & MMH Storyboard Shortcut */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => onNavigateToTab('prompt_library')}
                className={`w-full py-2.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-between cursor-pointer shadow-xs ${
                  isDarkMode
                    ? 'bg-purple-950/60 hover:bg-purple-900/80 border-purple-700/50 hover:border-purple-500 text-purple-200 hover:text-white'
                    : 'bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-900'
                }`}
                title="Launch Prompt Engineering Library & MMH Storyboard"
              >
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Prompt Library & Storyboard</span>
                </span>
                <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded border ${
                  isDarkMode
                    ? 'text-amber-400 bg-amber-950/60 border-amber-700/40'
                    : 'text-amber-800 bg-amber-100 border-amber-300'
                }`}>
                  Library →
                </span>
              </button>
            </div>

            {/* VideoExpress.ai Talking Avatar Agent Shortcut */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => onNavigateToTab('video_express')}
                className={`w-full py-2.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-between cursor-pointer shadow-xs ${
                  isDarkMode
                    ? 'bg-rose-950/60 hover:bg-rose-900/80 border-rose-700/50 hover:border-rose-500 text-rose-200 hover:text-white'
                    : 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-900'
                }`}
                title="Launch VideoExpress.ai Consistent Character Talking Avatar Agent"
              >
                <span className="flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-rose-400" />
                  <span>VideoExpress Avatar Agent</span>
                </span>
                <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded border ${
                  isDarkMode
                    ? 'text-rose-400 bg-rose-950/60 border-rose-700/40'
                    : 'text-rose-800 bg-rose-100 border-rose-300'
                }`}>
                  Avatar →
                </span>
              </button>
            </div>

            {/* Nextcloud / WebDAV Sync Button - Dedicated to /Music-Production */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => onNavigateToTab('nextcloud_sync')}
                className={`w-full py-2.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-between cursor-pointer shadow-xs ${
                  isDarkMode
                    ? 'bg-indigo-950/60 hover:bg-indigo-900/80 border-indigo-700/50 hover:border-indigo-500 text-indigo-200 hover:text-white'
                    : 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-900'
                }`}
                title="Launch Nextcloud Live WebDAV & Folder 207332 /Music-Production Asset Matcher"
              >
                <span className="flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-indigo-500" />
                  <span>/Music-Production Matcher</span>
                </span>
                <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded border ${
                  isDarkMode
                    ? 'text-emerald-400 bg-emerald-950/60 border-emerald-700/40'
                    : 'text-emerald-800 bg-emerald-100 border-emerald-300'
                }`}>
                  Live Sync →
                </span>
              </button>
            </div>

            {/* Nashville SOP Rules & Markdown Editor Shortcut */}
            <div className={`pt-2 border-t ${
              isDarkMode ? 'border-slate-800/80' : 'border-slate-200'
            }`}>
              <button
                type="button"
                onClick={() => onNavigateToTab('lyrics')}
                className={`w-full py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                  isDarkMode
                    ? 'bg-indigo-950/40 hover:bg-indigo-900/60 border-indigo-800/40 text-indigo-300 hover:text-white'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Nashville SOP Rules (.md)</span>
                </span>
                <span className="text-[10px] font-mono text-indigo-500">Configure →</span>
              </button>
            </div>

          </div>
        )}

      </div>

      {/* UNIVERSAL ASSET EDITOR MODAL (ADD, EDIT, ASK GEMINI, REASSIGN, LINK TO OTHER PROJECTS, DELETE) */}
      <UniversalAssetEditorModal
        isOpen={isAssetModalOpen}
        onClose={() => setIsAssetModalOpen(false)}
        asset={editingAssetItem}
        mode={assetModalMode}
        catalogTracks={tracks}
        onSaveAsset={handleSaveAssetFromModal}
        onDeleteAsset={handleDeleteAssetFromModal}
        onDuplicateAsset={(newAsset) => {
          handleSaveAssetFromModal(newAsset);
        }}
        isDarkMode={isDarkMode}
      />
    </aside>
  );
};
