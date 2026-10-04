import React, { useState, useEffect } from 'react';
import {
  HardDrive,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Copy,
  Music,
  FileText,
  ImageIcon,
  Video,
  Play,
  Pause,
  Filter,
  Sparkles,
  Link as LinkIcon,
  Tag,
  Key,
  ShieldCheck,
  Download,
  Layers,
  ArrowRight,
  Folder,
  Sliders,
  Check,
  Lock,
  Radio,
  FileCode,
  FileSpreadsheet,
  ChevronRight,
  ChevronDown,
  Info,
  Clock,
  Eye,
  Settings,
  Edit3,
  Trash2,
  Plus,
  ChevronLeft,
  X,
  Loader2
} from 'lucide-react';
import { Track, NextcloudFolderAsset, NextcloudAssetCategory, NextcloudSyncConfig, UniversalAssetItem } from '../types';
import { UniversalAssetEditorModal } from './UniversalAssetEditorModal';
import {
  getSavedNextcloudAssets,
  saveNextcloudAssets,
  getSavedNextcloudConfig,
  saveNextcloudConfig,
  autoMatchAssetToCatalog,
  INITIAL_FOLDER_207332_ASSETS,
  DEFAULT_NEXTCLOUD_CONFIG,
  ALL_CANONICAL_NEXTCLOUD_ASSETS,
  buildNextcloudStreamUrl
} from '../data/nextcloudFolderAssets';
import { audioMiniDaw } from '../utils/audioEngine';
import { getTrackStems } from '../data/nextcloudAssetIndex';
import { HelpCircle } from 'lucide-react';
import { SectionQuickHelpBanner } from './SectionQuickHelpBanner';
import { NextcloudWebDavFileExplorer } from './NextcloudWebDavFileExplorer';

interface NextcloudBentoSyncTabProps {
  tracks: Track[];
  selectedTrack: Track;
  onSelectTrack: (track: Track) => void;
  onApplyAssetToTrack: (asset: NextcloudFolderAsset, trackId: string) => void;
  isDarkMode: boolean;
  onNavigateToTab?: (tab: string) => void;
  onOpenSectionGuide?: (sectionId?: any) => void;
}

export const NextcloudBentoSyncTab: React.FC<NextcloudBentoSyncTabProps> = ({
  tracks,
  selectedTrack,
  onSelectTrack,
  onApplyAssetToTrack,
  isDarkMode,
  onNavigateToTab,
  onOpenSectionGuide
}) => {
  // Config & Credentials State
  const [config, setConfig] = useState<NextcloudSyncConfig>(() => getSavedNextcloudConfig());
  const [appPasswordInput, setAppPasswordInput] = useState(config.appPassword || '');
  const [showPassword, setShowPassword] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Sync & Connection Test State
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isSyncingFolder, setIsSyncingFolder] = useState(false);
  const [connectionResult, setConnectionResult] = useState<{
    success: boolean;
    status?: number;
    latencyMs?: number;
    message?: string;
    isAuthRequired?: boolean;
    snippet?: string;
  } | null>(null);

  // Assets strictly inside /Music-Production (Folder ID: 207332)
  const [viewModeTab, setViewModeTab] = useState<'explorer' | 'bento'>('explorer');
  const [assets, setAssets] = useState<NextcloudFolderAsset[]>(() => getSavedNextcloudAssets(tracks));
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'MASTERS' | 'STEMS' | 'VISUALS' | 'DOCS' | 'MATCHED' | 'UNMATCHED'>('ALL');
  const [activeSubfolder, setActiveSubfolder] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

  // Folder View Width Mode: 'slim' (-65% width reduction), 'compact' (33%), 'balanced' (50%)
  const [folderWidthMode, setFolderWidthMode] = useState<'slim' | 'compact' | 'balanced'>('slim');

  // Universal Asset Editor Modal State
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [modalAssetItem, setModalAssetItem] = useState<UniversalAssetItem | null>(null);
  const [assetModalMode, setAssetModalMode] = useState<'edit' | 'add' | 'gemini'>('edit');

  // Audio Stem Preview
  const [playingAssetId, setPlayingAssetId] = useState<string | null>(null);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [copiedPill, setCopiedPill] = useState('');

  // Subscribe to audio engine loading / buffering states
  useEffect(() => {
    return audioMiniDaw.addLoadingListener(setIsAudioLoading);
  }, []);

  // Persist config changes
  useEffect(() => {
    saveNextcloudConfig(config);
  }, [config]);

  // Persist asset changes
  useEffect(() => {
    saveNextcloudAssets(assets);
  }, [assets]);

  const copyText = (text: string, label: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    setCopiedPill(`Copied ${label}!`);
    setTimeout(() => setCopiedPill(''), 3000);
  };

  const handleOpenAddAssetModal = (defaultCategory?: NextcloudAssetCategory) => {
    const cat = defaultCategory || (activeFilter === 'STEMS' ? 'UVR5_VOCAL_STEM' : activeFilter === 'VISUALS' ? 'VISUAL_ARTWORK' : 'MASTER_AUDIO');
    const newId = `nc-asset-${Date.now()}`;
    const newItem: UniversalAssetItem = {
      id: newId,
      type: 'nextcloud',
      name: 'New Production Asset ' + new Date().toLocaleTimeString(),
      url: '',
      prompt: '',
      notes: '',
      trackId: selectedTrack.id,
      trackTitle: selectedTrack.title,
      linkedTrackIds: [],
      category: cat,
      tags: ['Nextcloud', cat.replace(/_/g, ' ')],
      timestamp: new Date().toISOString().split('T')[0]
    };
    setModalAssetItem(newItem);
    setAssetModalMode('add');
    setIsAssetModalOpen(true);
  };

  const handleOpenEditAssetModal = (asset: NextcloudFolderAsset, mode: 'edit' | 'gemini' = 'edit') => {
    const item: UniversalAssetItem = {
      id: asset.id,
      type: 'nextcloud',
      name: asset.filename,
      url: asset.previewImageUrl || asset.shareUrl || '',
      prompt: asset.notes || '',
      notes: asset.notes || '',
      trackId: asset.matchedTrackId || selectedTrack.id,
      trackTitle: asset.matchedTrackTitle || selectedTrack.title,
      linkedTrackIds: asset.linkedTrackIds || [],
      category: asset.category,
      bpm: asset.bpm,
      key: asset.key,
      fileSizeFormatted: asset.fileSizeFormatted,
      tags: asset.tags || ['Nextcloud', asset.category.replace(/_/g, ' ')],
      timestamp: asset.lastSyncedAt || new Date().toISOString().split('T')[0],
      originalRef: asset
    };
    setModalAssetItem(item);
    setAssetModalMode(mode);
    setIsAssetModalOpen(true);
  };

  const handleDeleteAsset = (assetId: string) => {
    setAssets(prev => prev.filter(a => a.id !== assetId));
    if (selectedAssetId === assetId) {
      setSelectedAssetId(null);
    }
    setCopiedPill('Asset deleted from /Music-Production');
    setTimeout(() => setCopiedPill(''), 3000);
  };

  const handleSaveAssetFromModal = (updated: UniversalAssetItem) => {
    const track = tracks.find(t => t.id === updated.trackId);
    setAssets(prev => {
      const exists = prev.some(a => a.id === updated.id);
      if (exists) {
        return prev.map(a => {
          if (a.id === updated.id) {
            return {
              ...a,
              filename: updated.name || a.filename,
              category: (updated.category as NextcloudAssetCategory) || a.category,
              matchedTrackId: updated.trackId || undefined,
              matchedTrackTitle: track?.title,
              isMatched: !!updated.trackId,
              matchConfidence: updated.trackId ? 100 : 0,
              linkedTrackIds: updated.linkedTrackIds,
              tags: updated.tags,
              notes: updated.notes || updated.prompt || a.notes,
              bpm: updated.bpm || a.bpm,
              key: updated.key || a.key,
              previewImageUrl: updated.url || a.previewImageUrl
            };
          }
          return a;
        });
      } else {
        const newAsset: NextcloudFolderAsset = {
          id: updated.id,
          folderId: '207332',
          filename: updated.name,
          mimeType: updated.type === 'image' ? 'image/png' : updated.type === 'video' ? 'video/mp4' : 'audio/wav',
          webdavPath: `/remote.php/dav/files/${config.username}/Music-Production/${updated.name}`,
          fileSizeFormatted: updated.fileSizeFormatted || '18.4 MB',
          fileSizeBytes: 18400000,
          category: (updated.category as NextcloudAssetCategory) || 'MASTER_AUDIO',
          lastSyncedAt: updated.timestamp || new Date().toISOString().split('T')[0],
          isMatched: !!updated.trackId,
          matchConfidence: updated.trackId ? 100 : 0,
          matchedTrackId: updated.trackId || undefined,
          matchedTrackTitle: track?.title,
          linkedTrackIds: updated.linkedTrackIds,
          tags: updated.tags,
          notes: updated.notes || updated.prompt || '',
          bpm: updated.bpm,
          key: updated.key,
          shareUrl: `https://nextcloud.moyercloud.com/s/${updated.id}`
        };
        return [newAsset, ...prev];
      }
    });
    setCopiedPill(`Saved asset "${updated.name}"`);
    setTimeout(() => setCopiedPill(''), 3000);
  };

  const handleToggleLinkTrack = (assetId: string, trackIdToToggle: string) => {
    setAssets(prev =>
      prev.map(a => {
        if (a.id === assetId) {
          const currentLinks = a.linkedTrackIds || [];
          const isLinked = currentLinks.includes(trackIdToToggle);
          const nextLinks = isLinked
            ? currentLinks.filter(id => id !== trackIdToToggle)
            : [...currentLinks, trackIdToToggle];
          return { ...a, linkedTrackIds: nextLinks };
        }
        return a;
      })
    );
  };

  // 1. Live WebDAV Connection Test
  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setConnectionResult(null);

    try {
      const res = await fetch('/api/nextcloud/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serverUrl: config.serverUrl,
          username: config.username,
          password: appPasswordInput,
          webdavPath: '/remote.php/dav/files/ncted/Music-Production'
        })
      });
      const data = await res.json();
      setConnectionResult(data);

      setConfig(prev => ({
        ...prev,
        appPassword: appPasswordInput,
        lastConnectionStatus: data.success ? 'connected' : data.isAuthRequired ? 'unauthorized' : 'error',
        lastPingMs: data.latencyMs,
        lastSyncTimestamp: new Date().toLocaleTimeString()
      }));
    } catch (err: any) {
      setConnectionResult({
        success: false,
        status: 0,
        message: `Network error: ${err.message || 'Cannot reach Nextcloud endpoint'}`
      });
      setConfig(prev => ({
        ...prev,
        lastConnectionStatus: 'error'
      }));
    } finally {
      setIsTestingConnection(false);
    }
  };

  // 2. Live Sync Folder (/Music-Production)
  const handleSyncFolder = async () => {
    setIsSyncingFolder(true);
    try {
      if (appPasswordInput) {
        await fetch('/api/nextcloud/save-credentials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            serverUrl: config.serverUrl,
            username: config.username,
            password: appPasswordInput
          })
        }).catch(() => {});
      }

      const res = await fetch('/api/nextcloud/sync-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folderId: '207332',
          serverUrl: config.serverUrl,
          username: config.username,
          password: appPasswordInput,
          webdavPath: '/remote.php/dav/files/ncted/Music-Production',
          folderPath: '/Music-Production'
        })
      });
      const data = await res.json();
      const returnedFiles = data.files || data.liveFiles || [];

      if (data.success && returnedFiles.length > 0) {
        // Merge live WebDAV files with current asset catalog
        const syncedAssets: NextcloudFolderAsset[] = returnedFiles.map((file: any, idx: number) => {
          const existing = assets.find(a => a.filename.toLowerCase() === file.name.toLowerCase());
          const webdavPath = file.href || `/remote.php/dav/files/ncted/Music-Production/${file.name}`;
          const audioUrl = buildNextcloudStreamUrl(webdavPath);

          if (existing) {
            return {
              ...existing,
              fileSizeBytes: file.size || existing.fileSizeBytes,
              webdavPath,
              audioUrl: existing.audioUrl || audioUrl,
              lastSyncedAt: new Date().toISOString()
            };
          }

          // Auto-categorize fresh file
          const guessedCat: NextcloudAssetCategory =
            file.name.endsWith('.wav') || file.name.endsWith('.mp3')
              ? file.name.includes('Vocal')
                ? 'UVR5_VOCAL_STEM'
                : file.name.includes('Inst')
                ? 'INSTRUMENTAL_STEM'
                : 'MASTER_AUDIO'
              : file.name.endsWith('.png') || file.name.endsWith('.jpg')
              ? 'VISUAL_ARTWORK'
              : file.name.endsWith('.mp4')
              ? 'VIDEO_REEL'
              : 'LYRIC_SOP_DOC';

          const match = autoMatchAssetToCatalog(file.name, tracks);
          const matchedTrack = match.matchedTrackId ? tracks.find(t => t.id === match.matchedTrackId) : null;
          const isAudio = guessedCat.includes('AUDIO') || guessedCat.includes('STEM');

          return {
            id: `NC-LIVE-${Date.now()}-${idx}`,
            filename: file.name,
            folderId: '207332',
            category: guessedCat,
            fileSizeBytes: file.size || 0,
            fileSizeFormatted: `${Math.round((file.size || 0) / 1024 / 1024)} MB`,
            mimeType: file.mimeType || 'application/octet-stream',
            webdavPath,
            audioUrl: isAudio ? audioUrl : undefined,
            shareUrl: 'https://nextcloud.moyercloud.com/index.php/apps/files/files/207332?dir=/Music-Production',
            matchedTrackId: match.matchedTrackId || undefined,
            matchedTrackTitle: matchedTrack?.title,
            matchConfidence: match.confidence,
            suggestedTrackId: match.matchedTrackId || undefined,
            suggestedCategory: match.detectedCategory || guessedCat,
            isMatched: !!match.matchedTrackId && match.confidence >= 50,
            notes: `Synced from Nextcloud folder /Music-Production on ${new Date().toLocaleDateString()}`,
            lastSyncedAt: new Date().toISOString()
          };
        });

        setAssets(syncedAssets);
        setCopiedPill(`Live synced ${syncedAssets.length} files from /Music-Production!`);
      } else {
        handleAutoMatchAll();
        setCopiedPill('Refreshed /Music-Production files & catalog match scores');
      }
    } catch (err: any) {
      console.warn('Folder sync error:', err);
      handleAutoMatchAll();
    } finally {
      setIsSyncingFolder(false);
      setTimeout(() => setCopiedPill(''), 3500);
    }
  };

  // 3. Smart Auto-Match all assets against canonical tracks
  const handleAutoMatchAll = () => {
    setAssets(prev =>
      prev.map(asset => {
        const match = autoMatchAssetToCatalog(asset.filename, tracks);
        const matchedTrack = match.matchedTrackId ? tracks.find(t => t.id === match.matchedTrackId) : null;
        return {
          ...asset,
          matchedTrackId: match.matchedTrackId || undefined,
          matchedTrackTitle: matchedTrack?.title,
          matchConfidence: match.confidence,
          suggestedTrackId: match.matchedTrackId || undefined,
          suggestedCategory: match.detectedCategory || asset.category,
          isMatched: !!match.matchedTrackId && match.confidence >= 50
        };
      })
    );
    setCopiedPill('Auto-matched /Music-Production assets across catalog!');
    setTimeout(() => setCopiedPill(''), 3500);
  };

  // 4. Manually assign asset to track
  const handleAssignTrack = (assetId: string, trackId: string | null) => {
    const matchedTrack = trackId ? tracks.find(t => t.id === trackId) : null;
    setAssets(prev =>
      prev.map(a =>
        a.id === assetId
          ? {
              ...a,
              matchedTrackId: trackId || undefined,
              matchedTrackTitle: matchedTrack?.title,
              matchConfidence: trackId ? 100 : 0,
              isMatched: !!trackId
            }
          : a
      )
    );
  };

  // 5. Change Category
  const handleChangeCategory = (assetId: string, category: NextcloudAssetCategory) => {
    setAssets(prev => prev.map(a => (a.id === assetId ? { ...a, category } : a)));
  };

  // 6. Audition stem audio with physical modeling synthesis & authentic timbres
  const handleToggleAudition = (asset: NextcloudFolderAsset) => {
    if (playingAssetId === asset.id) {
      audioMiniDaw.stopPlayback();
      setPlayingAssetId(null);
    } else {
      audioMiniDaw.stopPlayback();
      const bpm = asset.bpm || selectedTrack.bpm || 80;
      const key = asset.key || selectedTrack.key || 'G Major';

      // Accurately determine stemType from category, filename, and stem metadata
      const fn = (asset.filename || '').toLowerCase();
      let stemType = asset.stemType || 'master';
      if (asset.category === 'UVR5_DRUMS_STEM' || fn.includes('drum') || fn.includes('percussion') || fn.includes('snare') || fn.includes('kick') || fn.includes('mpc') || fn.includes('anvil') || fn.includes('foley')) {
        stemType = 'drums';
      } else if (asset.category === 'UVR5_BASS_STEM' || fn.includes('bass') || fn.includes('sub') || fn.includes('808')) {
        stemType = 'bass';
      } else if (fn.includes('organ') || fn.includes('b3') || fn.includes('leslie') || fn.includes('pad')) {
        stemType = 'organ';
      } else if (fn.includes('guitar') || fn.includes('acoustic') || fn.includes('martin')) {
        stemType = 'guitar';
      } else if (fn.includes('piano') || fn.includes('rhodes') || fn.includes('wurlitzer') || fn.includes('keys')) {
        stemType = 'piano';
      } else if (asset.category === 'UVR5_HARMONY_STEM' || fn.includes('choir') || fn.includes('harmony') || fn.includes('harmonies')) {
        stemType = 'choir';
      } else if (asset.category === 'UVR5_VOCAL_STEM' || fn.includes('vocal') || fn.includes('lead') || fn.includes('acapella') || fn.includes('spoken')) {
        stemType = 'vocal';
      } else if (asset.category === 'MASTER_AUDIO' || fn.includes('master')) {
        stemType = 'master';
      }

      const assetTrack = (asset.matchedTrackId && tracks.find(t => t.id === asset.matchedTrackId)) ||
        (asset.linkedTrackIds && asset.linkedTrackIds.length > 0 && tracks.find(t => asset.linkedTrackIds!.includes(t.id))) ||
        selectedTrack;

      const matchedStem = getTrackStems(assetTrack).find(s =>
        s.name.toLowerCase().includes(fn) ||
        (s.webdavPath && s.webdavPath.toLowerCase().includes(fn))
      );
      const webdavPath = asset.webdavPath || matchedStem?.webdavPath || `/remote.php/dav/files/ncted/Music-Production/${asset.filename}`;
      const audioUrl = asset.audioUrl || matchedStem?.audioUrl || buildNextcloudStreamUrl(webdavPath);

      audioMiniDaw.startPlayback(
        [
          {
            id: 1,
            name: asset.name || asset.filename,
            vol: 92,
            pan: 0,
            muted: false,
            solo: true,
            trimIn: 0,
            trimOut: 120,
            freq: asset.freq || (stemType === 'drums' ? 120 : stemType === 'bass' ? 65 : stemType === 'vocal' ? 220 : 196),
            waveType: asset.waveType || (stemType === 'drums' ? 'square' : stemType === 'vocal' ? 'sawtooth' : 'triangle'),
            stemType: stemType as any,
            color: asset.color || '#06b6d4',
            audioUrl,
            webdavPath,
            isRealAudio: Boolean(audioUrl)
          }
        ],
        bpm,
        key,
        assetTrack.id,
        assetTrack.title
      );
      setPlayingAssetId(asset.id);
    }
  };

  // Lightbox Image Viewer State with Arrow Key Navigation
  const [bentoLightboxImage, setBentoLightboxImage] = useState<{ url: string; title: string; index: number } | null>(null);

  const previewableAssets = React.useMemo(() => {
    return assets.filter(a =>
      a.category === 'VISUAL_ARTWORK' ||
      a.category === 'VIDEO_REEL' ||
      Boolean(a.previewImageUrl) ||
      a.filename.endsWith('.png') ||
      a.filename.endsWith('.jpg') ||
      a.filename.endsWith('.webp')
    );
  }, [assets]);

  const handleOpenBentoLightbox = (url: string, title: string) => {
    const idx = previewableAssets.findIndex(a => (a.previewImageUrl || a.shareUrl) === url);
    setBentoLightboxImage({
      url,
      title,
      index: idx >= 0 ? idx : 0
    });
  };

  useEffect(() => {
    if (!bentoLightboxImage) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setBentoLightboxImage(null);
      } else if (e.key === 'ArrowRight') {
        setBentoLightboxImage(prev => {
          if (!prev || previewableAssets.length <= 1) return prev;
          const nextIdx = (prev.index + 1) % previewableAssets.length;
          const target = previewableAssets[nextIdx];
          return {
            url: target.previewImageUrl || target.shareUrl || '',
            title: target.filename,
            index: nextIdx
          };
        });
      } else if (e.key === 'ArrowLeft') {
        setBentoLightboxImage(prev => {
          if (!prev || previewableAssets.length <= 1) return prev;
          const prevIdx = (prev.index - 1 + previewableAssets.length) % previewableAssets.length;
          const target = previewableAssets[prevIdx];
          return {
            url: target.previewImageUrl || target.shareUrl || '',
            title: target.filename,
            index: prevIdx
          };
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [bentoLightboxImage, previewableAssets]);

  // Extract distinct subfolders inside /Music-Production
  const subfoldersList = [
    { id: 'ALL', name: 'All Files', count: assets.length },
    {
      id: 'stems',
      name: '📁 /stems/',
      count: assets.filter(a => a.webdavPath.includes('/stems/') || a.category.includes('STEM')).length
    },
    {
      id: 'masters',
      name: '📁 /masters/',
      count: assets.filter(a => a.category === 'MASTER_AUDIO' || a.filename.toLowerCase().includes('master')).length
    },
    {
      id: 'visuals',
      name: '📁 /visuals/',
      count: assets.filter(a => a.category === 'VISUAL_ARTWORK' || a.category === 'VIDEO_REEL').length
    },
    {
      id: 'sop',
      name: '📁 /sop_rules/',
      count: assets.filter(a => a.category === 'LYRIC_SOP_DOC' || a.category === 'CHORD_MIDI').length
    },
    {
      id: 'raw_ingest',
      name: '📁 /raw_ingest/',
      count: assets.filter(a => a.webdavPath.includes('/raw_ingest/') || !a.isMatched).length
    }
  ];

  // Filtering
  const filteredAssets = assets.filter(a => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      a.filename.toLowerCase().includes(q) ||
      (a.matchedTrackTitle && a.matchedTrackTitle.toLowerCase().includes(q)) ||
      (a.matchedTrackId && a.matchedTrackId.toLowerCase().includes(q)) ||
      a.category.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    // Subfolder filter
    if (activeSubfolder === 'stems') {
      if (!a.webdavPath.includes('/stems/') && !a.category.includes('STEM')) return false;
    } else if (activeSubfolder === 'masters') {
      if (a.category !== 'MASTER_AUDIO' && !a.filename.toLowerCase().includes('master')) return false;
    } else if (activeSubfolder === 'visuals') {
      if (a.category !== 'VISUAL_ARTWORK' && a.category !== 'VIDEO_REEL') return false;
    } else if (activeSubfolder === 'sop') {
      if (a.category !== 'LYRIC_SOP_DOC' && a.category !== 'CHORD_MIDI') return false;
    } else if (activeSubfolder === 'raw_ingest') {
      if (!a.webdavPath.includes('/raw_ingest/') && a.isMatched) return false;
    }

    // Category filter
    if (activeFilter === 'MASTERS') return a.category === 'MASTER_AUDIO';
    if (activeFilter === 'STEMS') return a.category === 'UVR5_VOCAL_STEM' || a.category === 'INSTRUMENTAL_STEM';
    if (activeFilter === 'VISUALS') return a.category === 'VISUAL_ARTWORK' || a.category === 'VIDEO_REEL';
    if (activeFilter === 'DOCS') return a.category === 'LYRIC_SOP_DOC' || a.category === 'CHORD_MIDI';
    if (activeFilter === 'MATCHED') return a.isMatched;
    if (activeFilter === 'UNMATCHED') return !a.isMatched;
    return true;
  });

  const totalCount = assets.length;
  const matchedCount = assets.filter(a => a.isMatched).length;
  const totalSizeBytes = assets.reduce((sum, a) => sum + (a.fileSizeBytes || 0), 0);
  const totalSizeFormatted = `${(totalSizeBytes / (1024 * 1024)).toFixed(1)} MB`;

  // Selected asset detail
  const currentAsset = assets.find(a => a.id === selectedAssetId) || filteredAssets[0] || assets[0];

  return (
    <div className={`space-y-4 transition-colors duration-200 ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
      {/* Toast Notification */}
      {copiedPill && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2 rounded-xl bg-indigo-600 text-white font-mono text-xs font-bold shadow-xl border border-indigo-400/40 animate-bounce flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-300" />
          <span>{copiedPill}</span>
        </div>
      )}

      {/* SECTION QUICK HELP BANNER & SOP GUIDE */}
      <SectionQuickHelpBanner
        sectionId="nextcloud_sync"
        onOpenModalGuide={(sec) => onOpenSectionGuide?.(sec || 'nextcloud_sync')}
        isDarkMode={isDarkMode}
      />

      {/* VIEW MODE SWITCHER: LIVE WEBDAV FILE EXPLORER vs BENTO CATALOG MATCHER */}
      <div className={`p-2 rounded-2xl border flex items-center justify-between gap-3 flex-wrap ${
        isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-2xs'
      }`}>
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950/80 border border-slate-800">
          <button
            type="button"
            onClick={() => setViewModeTab('explorer')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              viewModeTab === 'explorer'
                ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Folder className="w-3.5 h-3.5 text-cyan-300" />
            <span>Nextcloud WebDAV File Explorer</span>
            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-cyan-400/20 text-cyan-200 font-normal">Live</span>
          </button>

          <button
            type="button"
            onClick={() => setViewModeTab('bento')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              viewModeTab === 'bento'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-indigo-300" />
            <span>Bento Catalog Matcher (207332)</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 font-bold">Tailscale Direct Mesh</span>
          </span>
          <span>·</span>
          <span>Server: <strong className="text-cyan-400">{config.serverUrl || 'https://nextcloud.mermaid-symmetric.ts.net'}</strong></span>
          <span>·</span>
          <span>User: <strong className="text-indigo-400">{config.username}</strong></span>
        </div>
      </div>

      {viewModeTab === 'explorer' ? (
        <NextcloudWebDavFileExplorer
          tracks={tracks}
          selectedTrack={selectedTrack}
          onSelectTrack={onSelectTrack}
          onSendToMixer={(file) => {
            if (onNavigateToTab) onNavigateToTab('mixer');
          }}
          isDarkMode={isDarkMode}
          className="min-h-[750px]"
        />
      ) : (
        <>
      {/* COMPACT BREADCRUMB & FOLDER BANNER: ZERO WASTED SPACE */}
      <div
        className={`p-4 rounded-2xl border transition-all ${
          isDarkMode
            ? 'bg-slate-900 border-slate-800 shadow-md'
            : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          {/* Breadcrumb Path */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className={`p-2 rounded-xl border ${
              isDarkMode ? 'bg-indigo-950/80 text-indigo-400 border-indigo-800/50' : 'bg-indigo-50 text-indigo-700 border-indigo-200'
            }`}>
              <HardDrive className="w-5 h-5" />
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 flex-wrap text-xs">
                <span className="text-slate-400 font-mono">Nextcloud Drive</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                <span className={`px-2 py-0.5 rounded-lg font-mono font-bold text-xs border flex items-center gap-1.5 ${
                  isDarkMode
                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                    : 'bg-indigo-50 text-indigo-800 border-indigo-300'
                }`}>
                  <Folder className="w-3.5 h-3.5 text-indigo-500 fill-indigo-500/30" />
                  <span>/Music-Production</span>
                  <span className="opacity-75 font-normal">(Root • ID: 207332)</span>
                </span>
                
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border flex items-center gap-1 ${
                  config.lastConnectionStatus === 'connected'
                    ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'
                    : 'bg-slate-500/15 text-slate-400 border-slate-500/30'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${config.lastConnectionStatus === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
                  <span>{config.lastConnectionStatus === 'connected' ? 'WebDAV Active' : 'Ready'}</span>
                </span>
              </div>

              <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
                <span>{totalCount} music files</span>
                <span>•</span>
                <span>{totalSizeFormatted} total</span>
                <span>•</span>
                <span className="text-emerald-500 font-bold">{matchedCount} matched to 26 catalog songs</span>
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-start md:justify-end">
            {onOpenSectionGuide && (
              <button
                type="button"
                onClick={() => onOpenSectionGuide('nextcloud_sync')}
                className="px-3.5 py-1.5 rounded-xl bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 text-xs font-bold border border-amber-700/50 flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                title="Open Nextcloud WebDAV Operating Guide & SOP Rules"
              >
                <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>How To Use Nextcloud</span>
              </button>
            )}

            <button
              onClick={handleSyncFolder}
              disabled={isSyncingFolder}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm shadow-indigo-950/40 cursor-pointer"
              title="Rescan and synchronize files inside /Music-Production"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingFolder ? 'animate-spin' : ''}`} />
              <span>{isSyncingFolder ? 'Syncing...' : 'Sync /Music-Production'}</span>
            </button>

            <button
              onClick={handleAutoMatchAll}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                isDarkMode
                  ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
              }`}
              title="Auto-match filenames to canonical 26 tracks"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span className="hidden sm:inline">Auto-Match Catalog</span>
              <span className="sm:hidden">Match</span>
            </button>

            <a
              href={`${config.serverUrl || 'https://nextcloud.mermaid-symmetric.ts.net'}/index.php/apps/files/files/207332?dir=/Music-Production`}
              target="_blank"
              rel="noreferrer"
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition cursor-pointer ${
                isDarkMode
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
              }`}
              title="Open folder directly in Nextcloud browser"
            >
              <span>Nextcloud Web</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>

            {/* Toggle WebDAV Credentials Drawer */}
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className={`p-1.5 rounded-xl border transition cursor-pointer ${
                isSettingsOpen
                  ? 'bg-indigo-600 text-white border-indigo-500'
                  : isDarkMode
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border-slate-700'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-300'
              }`}
              title="Configure Nextcloud WebDAV credentials & App Password"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* COMPACT SETTINGS DRAWER (EXPANDS ONLY WHEN REQUESTED) */}
        {isSettingsOpen && (
          <div className={`mt-3 pt-3 border-t space-y-3 ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center justify-between text-[11px] font-mono uppercase font-bold text-slate-400 mb-1">
                  <span className="flex items-center gap-1">
                    <Key className="w-3 h-3 text-amber-500" />
                    <span>Nextcloud App Password (for user: {config.username})</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-indigo-500 hover:underline font-bold"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={appPasswordInput}
                    onChange={e => setAppPasswordInput(e.target.value)}
                    placeholder="Enter Nextcloud App Password (e.g. xxxx-xxxx-xxxx)..."
                    className={`flex-1 p-2 rounded-xl border font-mono text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                      isDarkMode
                        ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600'
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                  <button
                    onClick={handleTestConnection}
                    disabled={isTestingConnection}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer flex-shrink-0 ${
                      isDarkMode
                        ? 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border-slate-700'
                        : 'bg-slate-100 hover:bg-slate-200 text-cyan-700 border-slate-300'
                    }`}
                  >
                    {isTestingConnection ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Radio className="w-3.5 h-3.5" />}
                    <span>Test Ping</span>
                  </button>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 font-mono sm:max-w-xs space-y-0.5">
                <div>Direct WebDAV Endpoint:</div>
                <div className="text-indigo-400 truncate select-all">
                  /remote.php/dav/files/{config.username}/Music-Production
                </div>
              </div>
            </div>

            {connectionResult && (
              <div
                className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                  connectionResult.success
                    ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
                    : connectionResult.isAuthRequired
                    ? 'bg-amber-950/40 border-amber-800/60 text-amber-200'
                    : 'bg-red-950/40 border-red-800/60 text-red-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  {connectionResult.success ? (
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  )}
                  <span className="text-[11px]">{connectionResult.message}</span>
                </div>
                {connectionResult.latencyMs && (
                  <span className="text-[10px] font-mono text-slate-400">{connectionResult.latencyMs}ms</span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* SUBFOLDER TABS INSIDE /Music-Production */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
        {subfoldersList.map(folder => {
          const isActive = activeSubfolder === folder.id;
          return (
            <button
              key={folder.id}
              onClick={() => setActiveSubfolder(folder.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : isDarkMode
                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              <span>{folder.name}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                isActive
                  ? 'bg-indigo-700 text-indigo-100'
                  : isDarkMode
                  ? 'bg-slate-800 text-slate-400'
                  : 'bg-slate-100 text-slate-500'
              }`}>
                {folder.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* FILTER & SEARCH BAR */}
      <div
        className={`p-3 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 ${
          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 custom-scrollbar">
          <button
            onClick={() => setActiveFilter('ALL')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex-shrink-0 ${
              activeFilter === 'ALL'
                ? 'bg-slate-700 text-white'
                : isDarkMode
                ? 'text-slate-400 hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Categories
          </button>
          <button
            onClick={() => setActiveFilter('MASTERS')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex-shrink-0 ${
              activeFilter === 'MASTERS'
                ? 'bg-cyan-600 text-white'
                : isDarkMode
                ? 'text-cyan-400 hover:text-cyan-200'
                : 'text-cyan-700 hover:text-cyan-900'
            }`}
          >
            Masters (WAV 2448)
          </button>
          <button
            onClick={() => setActiveFilter('STEMS')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex-shrink-0 ${
              activeFilter === 'STEMS'
                ? 'bg-purple-600 text-white'
                : isDarkMode
                ? 'text-purple-400 hover:text-purple-200'
                : 'text-purple-700 hover:text-purple-900'
            }`}
          >
            UVR5 Stems
          </button>
          <button
            onClick={() => setActiveFilter('VISUALS')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex-shrink-0 ${
              activeFilter === 'VISUALS'
                ? 'bg-amber-600 text-white'
                : isDarkMode
                ? 'text-amber-400 hover:text-amber-200'
                : 'text-amber-700 hover:text-amber-900'
            }`}
          >
            Visuals & Video
          </button>
          <button
            onClick={() => setActiveFilter('DOCS')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex-shrink-0 ${
              activeFilter === 'DOCS'
                ? 'bg-emerald-600 text-white'
                : isDarkMode
                ? 'text-emerald-400 hover:text-emerald-200'
                : 'text-emerald-700 hover:text-emerald-900'
            }`}
          >
            SOP & Chords
          </button>
          <button
            onClick={() => setActiveFilter('MATCHED')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex-shrink-0 ${
              activeFilter === 'MATCHED'
                ? 'bg-teal-600 text-white'
                : isDarkMode
                ? 'text-teal-400 hover:text-teal-200'
                : 'text-teal-700 hover:text-teal-900'
            }`}
          >
            Matched ({matchedCount})
          </button>
        </div>

        <div className="w-full sm:w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search /Music-Production files..."
            className={`w-full px-3 py-1.5 rounded-xl border text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
              isDarkMode
                ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500'
                : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
            }`}
          />
        </div>
      </div>

      {/* MAIN FOLDER CONTENTS VIEW (FILES INSIDE /Music-Production) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: File Explorer & Audio Audition List - Width controlled by folderWidthMode */}
        <div className={`${
          folderWidthMode === 'slim'
            ? 'lg:col-span-3 space-y-2'
            : folderWidthMode === 'compact'
            ? 'lg:col-span-4 space-y-2'
            : 'lg:col-span-6 space-y-2.5'
        }`}>
          {/* Folder View Toolbar: Width Selector & Add Asset */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-1 text-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-mono text-slate-400 text-[11px] font-bold">
                {filteredAssets.length} Files
              </span>
              <span className="text-slate-600">•</span>
              <div className="flex items-center gap-0.5 bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[9px] font-mono">
                <span className="text-slate-500 px-1">Width:</span>
                <button
                  type="button"
                  onClick={() => setFolderWidthMode('slim')}
                  className={`px-1.5 py-0.5 rounded font-bold transition cursor-pointer ${
                    folderWidthMode === 'slim'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Slim view - reduces folder width by 65% for maximized workspace"
                >
                  Slim (-65%)
                </button>
                <button
                  type="button"
                  onClick={() => setFolderWidthMode('compact')}
                  className={`px-1.5 py-0.5 rounded font-bold transition cursor-pointer ${
                    folderWidthMode === 'compact'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Compact view - 33% width"
                >
                  Compact
                </button>
                <button
                  type="button"
                  onClick={() => setFolderWidthMode('balanced')}
                  className={`px-1.5 py-0.5 rounded font-bold transition cursor-pointer ${
                    folderWidthMode === 'balanced'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Balanced view - 50% split"
                >
                  50/50
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleOpenAddAssetModal()}
              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shadow-sm shadow-emerald-950/40"
              title="Add new asset to /Music-Production"
            >
              <Plus className="w-3 h-3" />
              <span>+ Add Asset</span>
            </button>
          </div>

          {filteredAssets.length === 0 ? (
            <div className={`p-8 rounded-2xl border text-center space-y-2 ${
              isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'
            }`}>
              <Folder className="w-8 h-8 text-slate-400 mx-auto" />
              <p className={`text-sm font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                No files found in /Music-Production matching filter
              </p>
              <p className="text-xs text-slate-400">Click "All Categories" or clear search query.</p>
              <button
                type="button"
                onClick={() => handleOpenAddAssetModal()}
                className="mt-2 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add First Asset to /Music-Production</span>
              </button>
            </div>
          ) : (
            filteredAssets.map(asset => {
              const isSelected = currentAsset?.id === asset.id;
              const isAudio =
                asset.category === 'MASTER_AUDIO' ||
                asset.category === 'UVR5_VOCAL_STEM' ||
                asset.category === 'INSTRUMENTAL_STEM';

              // Extract relative subfolder inside /Music-Production
              const relativeDisplayPath = asset.webdavPath.includes('/Music-Production/')
                ? asset.webdavPath.split('/Music-Production/')[1]
                : asset.filename;

              return (
                <div
                  key={asset.id}
                  onClick={() => setSelectedAssetId(asset.id)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'ring-2 ring-indigo-500 border-indigo-500 shadow-md bg-indigo-950/30'
                      : isDarkMode
                      ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                      : 'bg-white border-slate-200 hover:border-indigo-300 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0">
                      {/* Interactive Leading Icon Button: 1-Click Play or Lightbox View */}
                      {isAudio ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleAudition(asset);
                          }}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition group cursor-pointer border ${
                            playingAssetId === asset.id
                              ? isAudioLoading
                                ? 'bg-amber-500/30 text-amber-300 border-amber-400 ring-2 ring-amber-400/40 cursor-wait'
                                : 'bg-cyan-500 text-slate-950 border-cyan-400 ring-2 ring-cyan-400/40 shadow-sm'
                              : isDarkMode
                              ? 'bg-cyan-950/80 hover:bg-cyan-900 border-cyan-800/40 text-cyan-300'
                              : 'bg-cyan-50 hover:bg-cyan-100 border-cyan-200 text-cyan-700'
                          }`}
                          title={playingAssetId === asset.id ? (isAudioLoading ? 'Buffering Nextcloud audio...' : 'Pause Preview') : `Audition ${asset.filename} [Click icon]`}
                        >
                          {playingAssetId === asset.id ? (
                            isAudioLoading ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Pause className="w-3.5 h-3.5 fill-current" />
                            )
                          ) : (
                            <>
                              <Music className="w-3.5 h-3.5 group-hover:hidden" />
                              <Play className="w-3.5 h-3.5 fill-current hidden group-hover:block ml-0.5" />
                            </>
                          )}
                        </button>
                      ) : (asset.category === 'VISUAL_ARTWORK' || asset.previewImageUrl) ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenBentoLightbox(asset.previewImageUrl || asset.shareUrl, asset.filename);
                          }}
                          className="w-7 h-7 rounded-lg overflow-hidden shrink-0 mt-0.5 border border-purple-500/40 hover:border-purple-400 bg-purple-950/40 flex items-center justify-center transition group cursor-pointer relative"
                          title={`View ${asset.filename} in Lightbox (← → Arrow keys to browse)`}
                        >
                          {asset.previewImageUrl ? (
                            <img src={asset.previewImageUrl} alt={asset.filename} className="w-full h-full object-cover group-hover:opacity-50 transition" />
                          ) : (
                            <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
                          )}
                          <Eye className="w-3.5 h-3.5 text-white absolute inset-0 m-auto hidden group-hover:block drop-shadow" />
                        </button>
                      ) : (
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          asset.category === 'VIDEO_REEL'
                            ? isDarkMode ? 'bg-rose-950 text-rose-400 border border-rose-800/40' : 'bg-rose-50 text-rose-700 border border-rose-200'
                            : isDarkMode ? 'bg-slate-800 text-slate-400 border border-slate-700' : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {asset.category === 'VIDEO_REEL' ? <Video className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                        </div>
                      )}

                      <div className="min-w-0 space-y-0.5">
                        <div className={`font-bold text-[11px] truncate leading-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`} title={asset.filename}>
                          {asset.filename}
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap text-[9px] font-mono text-slate-400">
                          <span
                            className={`px-1 rounded font-bold uppercase text-[8px] ${
                              asset.category === 'MASTER_AUDIO'
                                ? 'bg-cyan-500/20 text-cyan-400'
                                : asset.category === 'UVR5_VOCAL_STEM'
                                ? 'bg-purple-500/20 text-purple-400'
                                : asset.category === 'INSTRUMENTAL_STEM'
                                ? 'bg-indigo-500/20 text-indigo-400'
                                : asset.category === 'VISUAL_ARTWORK'
                                ? 'bg-amber-500/20 text-amber-400'
                                : asset.category === 'VIDEO_REEL'
                                ? 'bg-rose-500/20 text-rose-400'
                                : 'bg-emerald-500/20 text-emerald-400'
                            }`}
                          >
                            {asset.category.replace(/_/g, ' ')}
                          </span>

                          <span>{asset.fileSizeFormatted}</span>

                          {asset.bpm && (
                            <span className="text-cyan-400 font-bold">{asset.bpm}BPM</span>
                          )}
                          {asset.key && (
                            <span className="text-amber-400 font-bold">{asset.key}</span>
                          )}
                        </div>

                        {/* Matched & Linked Indicator */}
                        <div className="flex items-center gap-1 flex-wrap pt-0.5">
                          {asset.isMatched && asset.matchedTrackId ? (
                            <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[8px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800/40">
                              <CheckCircle className="w-2.5 h-2.5 text-emerald-400" />
                              <span>{asset.matchedTrackId}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[8px] font-bold bg-amber-950/80 text-amber-300 border border-amber-800/40">
                              <span>Unlinked</span>
                            </span>
                          )}

                          {asset.linkedTrackIds && asset.linkedTrackIds.length > 0 && (
                            <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[8px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800/40" title={`Linked to ${asset.linkedTrackIds.join(', ')}`}>
                              <LinkIcon className="w-2 h-2 text-indigo-400" />
                              <span>+{asset.linkedTrackIds.length}</span>
                            </span>
                          )}

                          {(asset.tags?.includes('google-flow') || asset.webdavPath.includes('GoogleFlow')) && (
                            <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[8px] font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-800/40" title="Imported from Google Flow video workflow">
                              <Sparkles className="w-2 h-2 text-cyan-400" />
                              <span>Flow</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quick Row Actions: Edit, Ask Gemini, Delete */}
                    <div className="flex items-center gap-0.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => handleOpenEditAssetModal(asset, 'gemini')}
                        className="p-1 rounded-md bg-purple-950/80 hover:bg-purple-900 border border-purple-800/40 text-amber-300 hover:text-amber-200 transition cursor-pointer"
                        title="Ask Gemini to change this asset"
                      >
                        <Sparkles className="w-3 h-3" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEditAssetModal(asset, 'edit')}
                        className={`p-1 rounded-md transition cursor-pointer ${
                          isDarkMode
                            ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                        title="Edit all aspects of this asset"
                      >
                        <Edit3 className="w-3 h-3 text-indigo-400" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteAsset(asset.id)}
                        className={`p-1 rounded-md transition cursor-pointer ${
                          isDarkMode
                            ? 'bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400'
                            : 'bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600'
                        }`}
                        title="Delete asset"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right: File Inspector & Deep Asset Editor Workbench - Expanded width */}
        <div className={`${
          folderWidthMode === 'slim'
            ? 'lg:col-span-9'
            : folderWidthMode === 'compact'
            ? 'lg:col-span-8'
            : 'lg:col-span-6'
        }`}>
          {currentAsset ? (
            <div
              className={`p-4 sm:p-6 rounded-3xl border sticky top-20 space-y-4 ${
                isDarkMode ? 'bg-slate-900 border-slate-800 shadow-xl' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              {/* Header with Quick Actions */}
              <div className={`flex flex-wrap items-center justify-between gap-3 pb-3 border-b ${
                isDarkMode ? 'border-slate-800/80' : 'border-slate-200'
              }`}>
                <div className="flex items-center gap-2 min-w-0">
                  <Tag className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                  <div>
                    <h3 className={`text-sm font-black uppercase tracking-wider truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      {currentAsset.filename}
                    </h3>
                    <div className="text-[10px] font-mono text-slate-400">
                      ID: {currentAsset.id} • {currentAsset.fileSizeFormatted}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleOpenEditAssetModal(currentAsset, 'gemini')}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-purple-950/40 cursor-pointer"
                    title="Ask Gemini to change, refine, or enhance this asset"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Ask Gemini to Change</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenEditAssetModal(currentAsset, 'edit')}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                    title="Open full editor modal to change all aspects"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit All Aspects</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteAsset(currentAsset.id)}
                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-950 border border-slate-700 hover:border-rose-700/60 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                    title="Delete this asset"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Visual Preview if Image or Video */}
              {currentAsset.previewImageUrl && (
                <div
                  onClick={() => handleOpenBentoLightbox(currentAsset.previewImageUrl!, currentAsset.filename)}
                  className="relative rounded-2xl overflow-hidden border border-slate-800 aspect-video group max-h-56 bg-black cursor-pointer shadow-md"
                  title="Click to view in Lightbox (← → Arrow keys to browse)"
                >
                  <img
                    src={currentAsset.previewImageUrl}
                    alt={currentAsset.filename}
                    className="w-full h-full object-contain group-hover:scale-102 transition"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent flex items-end justify-between p-3 text-xs text-white">
                    <span className="font-bold truncate">{currentAsset.filename}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEditAssetModal(currentAsset, 'gemini');
                      }}
                      className="px-2 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-[10px] font-bold flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3 text-amber-300" />
                      <span>Gemini Edit</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Quick Inline Aspect Editors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Filename Editor */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase font-bold text-slate-400 block">
                    Asset Filename / Title:
                  </label>
                  <input
                    type="text"
                    value={currentAsset.filename}
                    onChange={(e) => {
                      const newName = e.target.value;
                      setAssets(prev => prev.map(a => a.id === currentAsset.id ? { ...a, filename: newName } : a));
                    }}
                    className={`w-full p-2 rounded-xl border text-xs font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                      isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                {/* Category Assignment */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase font-bold text-slate-400 block">
                    Category Tag:
                  </label>
                  <select
                    value={currentAsset.category}
                    onChange={e => handleChangeCategory(currentAsset.id, e.target.value as NextcloudAssetCategory)}
                    className={`w-full p-2 rounded-xl border text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                      isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="MASTER_AUDIO">Master Audio (WAV / 24-bit 48kHz)</option>
                    <option value="UVR5_VOCAL_STEM">UVR5 Vocal Stem (Isolated / Clean)</option>
                    <option value="INSTRUMENTAL_STEM">Instrumental Stem (Guitars, Keys, Drums, 808s)</option>
                    <option value="VISUAL_ARTWORK">Visual Artwork (1:1 Album Cover)</option>
                    <option value="VIDEO_REEL">Video Reel (9:16 Vertical Short-Form)</option>
                    <option value="LYRIC_SOP_DOC">Lyric & SOP Document (.md / .txt)</option>
                    <option value="CHORD_MIDI">Chord Chart / MIDI (Nashville Number System)</option>
                    <option value="UNCATEGORIZED">Uncategorized / Pending</option>
                  </select>
                </div>
              </div>

              {/* Primary Project Reassignment & Suggestions */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-mono uppercase font-bold text-slate-400 block">
                    Assigned Master Track (Primary Project):
                  </label>
                  {currentAsset.suggestedTrackId && (
                    <button
                      onClick={() => handleAssignTrack(currentAsset.id, currentAsset.suggestedTrackId || null)}
                      className="text-[10px] text-indigo-500 hover:text-indigo-600 flex items-center gap-1 font-bold cursor-pointer"
                    >
                      <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                      <span>Use Suggestion ({currentAsset.suggestedTrackId})</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={currentAsset.matchedTrackId || ''}
                    onChange={e => handleAssignTrack(currentAsset.id, e.target.value || null)}
                    className={`flex-1 p-2 rounded-xl border text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                      isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="">-- Unassigned (Shared / Global Asset) --</option>
                    {tracks.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.id}: {t.title} ({t.ep}) [{t.bpm} BPM]
                      </option>
                    ))}
                  </select>
                  {currentAsset.matchedTrackId && (
                    <button
                      type="button"
                      onClick={() => {
                        const trk = tracks.find(t => t.id === currentAsset.matchedTrackId);
                        if (trk) onSelectTrack(trk);
                      }}
                      className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 font-mono text-xs font-bold whitespace-nowrap cursor-pointer"
                      title="Jump to this track in studio"
                    >
                      Jump to Track →
                    </button>
                  )}
                </div>
              </div>

              {/* Cross-Project Multi-Linking: Link this same asset to other projects! */}
              <div className="space-y-1.5 p-3 rounded-2xl bg-slate-950 border border-slate-800/80">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5">
                    <LinkIcon className="w-3 h-3 text-cyan-400" />
                    <span>Link to Additional Catalog Projects:</span>
                  </span>
                  <span className="text-slate-500">
                    {(currentAsset.linkedTrackIds || []).length} linked
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Select which other tracks in your catalog should have immediate access to this stem/asset:
                </p>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto custom-scrollbar pt-1">
                  {tracks.map(t => {
                    const isPrimary = currentAsset.matchedTrackId === t.id;
                    const isLinked = (currentAsset.linkedTrackIds || []).includes(t.id);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          if (isPrimary) return;
                          handleToggleLinkTrack(currentAsset.id, t.id);
                        }}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition flex items-center gap-1 cursor-pointer ${
                          isPrimary
                            ? 'bg-emerald-950 border-emerald-700/60 text-emerald-300 cursor-default'
                            : isLinked
                            ? 'bg-cyan-950 border-cyan-700/60 text-cyan-300'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                        title={isPrimary ? 'Primary Project' : isLinked ? 'Click to unlink' : 'Click to link'}
                      >
                        <span>{t.id}</span>
                        {isPrimary ? (
                          <span className="text-[8px] opacity-75">(Primary)</span>
                        ) : isLinked ? (
                          <span className="text-cyan-400 font-bold">✓</span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* BPM, Key & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase font-bold text-slate-400 block">
                    BPM / Tempo:
                  </label>
                  <input
                    type="number"
                    value={currentAsset.bpm || ''}
                    placeholder="e.g. 78"
                    onChange={(e) => {
                      const val = e.target.value ? parseInt(e.target.value) : undefined;
                      setAssets(prev => prev.map(a => a.id === currentAsset.id ? { ...a, bpm: val } : a));
                    }}
                    className={`w-full p-2 rounded-xl border text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                      isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase font-bold text-slate-400 block">
                    Musical Key:
                  </label>
                  <input
                    type="text"
                    value={currentAsset.key || ''}
                    placeholder="e.g. B Major"
                    onChange={(e) => {
                      const val = e.target.value;
                      setAssets(prev => prev.map(a => a.id === currentAsset.id ? { ...a, key: val } : a));
                    }}
                    className={`w-full p-2 rounded-xl border text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                      isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              {/* Notes & SOP Guidelines */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase font-bold text-slate-400 block">
                  Production Notes & Nashville SOP Details:
                </label>
                <textarea
                  rows={2}
                  value={currentAsset.notes || ''}
                  placeholder="Notes, mixing cues, Nashville SOP rules..."
                  onChange={(e) => {
                    const notes = e.target.value;
                    setAssets(prev => prev.map(a => a.id === currentAsset.id ? { ...a, notes } : a));
                  }}
                  className={`w-full p-2 rounded-xl border text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                    isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              {/* Audio Audition Player in Inspector */}
              {(currentAsset.category === 'MASTER_AUDIO' ||
                currentAsset.category === 'UVR5_VOCAL_STEM' ||
                currentAsset.category === 'INSTRUMENTAL_STEM') && (
                <div className={`p-3 rounded-2xl border space-y-2 ${
                  isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase font-bold text-slate-400 flex items-center gap-1.5">
                      <Music className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Audio Stem Audition</span>
                    </span>
                    <span className="text-[10px] font-mono text-cyan-500 font-bold">
                      {currentAsset.bpm || 80} BPM • 48kHz WAV
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleAudition(currentAsset)}
                    className={`w-full py-2 px-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer ${
                      playingAssetId === currentAsset.id
                        ? 'bg-cyan-500 text-slate-950'
                        : isDarkMode
                        ? 'bg-slate-800 hover:bg-slate-700 text-cyan-300'
                        : 'bg-cyan-100 hover:bg-cyan-200 text-cyan-800'
                    }`}
                  >
                    {playingAssetId === currentAsset.id ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{playingAssetId === currentAsset.id ? 'Stop Audition' : 'Play Isolated Stem Audio'}</span>
                  </button>
                </div>
              )}

              {/* Action Buttons: Apply, Copy WebDAV, External */}
              <div className={`space-y-2 pt-2 border-t ${
                isDarkMode ? 'border-slate-800/60' : 'border-slate-200'
              }`}>
                {currentAsset.matchedTrackId && (
                  <button
                    onClick={() => {
                      onApplyAssetToTrack(currentAsset, currentAsset.matchedTrackId!);
                      setCopiedPill(`Applied "${currentAsset.filename}" to ${currentAsset.matchedTrackId}!`);
                      setTimeout(() => setCopiedPill(''), 3500);
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/40 cursor-pointer"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Apply Asset to Track {currentAsset.matchedTrackId}</span>
                  </button>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    onClick={() => copyText(currentAsset.webdavPath, 'WebDAV Relative URI')}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      isDarkMode
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy WebDAV Path</span>
                  </button>

                  <a
                    href={`${config.serverUrl || 'https://nextcloud.mermaid-symmetric.ts.net'}/index.php/apps/files/files/207332?dir=/Music-Production`}
                    target="_blank"
                    rel="noreferrer"
                    className={`w-full py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      isDarkMode
                        ? 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-indigo-400 hover:text-white'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-indigo-700 hover:text-indigo-900'
                    }`}
                  >
                    <HardDrive className="w-3.5 h-3.5" />
                    <span>Open Nextcloud</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div className={`p-8 rounded-3xl border text-center text-xs ${
              isDarkMode ? 'border-slate-800 bg-slate-900 text-slate-500' : 'border-slate-200 bg-white text-slate-400'
            }`}>
              Select a file on the left to inspect, audition, match, and categorize.
            </div>
          )}
        </div>
      </div>
      </>
      )}

      {/* UNIVERSAL ASSET EDITOR MODAL: ADD, EDIT, ASK GEMINI, REASSIGN, LINK TO OTHER PROJECTS, DELETE */}
      <UniversalAssetEditorModal
        isOpen={isAssetModalOpen}
        onClose={() => setIsAssetModalOpen(false)}
        asset={modalAssetItem}
        mode={assetModalMode}
        catalogTracks={tracks}
        onSaveAsset={handleSaveAssetFromModal}
        onDeleteAsset={(id) => {
          handleDeleteAsset(id);
          setIsAssetModalOpen(false);
        }}
        onDuplicateAsset={(dup) => {
          handleSaveAssetFromModal(dup);
        }}
        isDarkMode={isDarkMode}
      />

      {/* FULLSCREEN LIGHTBOX MODAL WITH ARROW KEY NAVIGATION */}
      {bentoLightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
          onClick={() => setBentoLightboxImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Bar with title, index, and close */}
            <div className="w-full flex items-center justify-between pb-3 text-white text-xs font-mono">
              <span className="truncate max-w-md font-bold">
                {bentoLightboxImage.title}
              </span>
              <div className="flex items-center gap-3">
                <span className="text-slate-400">
                  {bentoLightboxImage.index + 1} of {previewableAssets.length}
                </span>
                <span className="text-[10px] text-slate-500 hidden sm:inline">
                  (← → Arrow keys / Esc)
                </span>
                <button
                  type="button"
                  onClick={() => setBentoLightboxImage(null)}
                  className="p-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer transition"
                  title="Close (Esc)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Image viewport with left/right buttons */}
            <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-black max-h-[75vh] flex items-center justify-center">
              <img
                src={bentoLightboxImage.url}
                alt={bentoLightboxImage.title}
                className="max-h-[75vh] max-w-full object-contain"
              />

              {previewableAssets.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setBentoLightboxImage(prev => {
                        if (!prev) return null;
                        const prevIdx = (prev.index - 1 + previewableAssets.length) % previewableAssets.length;
                        const target = previewableAssets[prevIdx];
                        return {
                          url: target.previewImageUrl || target.shareUrl || '',
                          title: target.filename,
                          index: prevIdx
                        };
                      });
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/90 border border-white/20 text-white cursor-pointer transition shadow-lg"
                    title="Previous image (← Arrow key)"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setBentoLightboxImage(prev => {
                        if (!prev) return null;
                        const nextIdx = (prev.index + 1) % previewableAssets.length;
                        const target = previewableAssets[nextIdx];
                        return {
                          url: target.previewImageUrl || target.shareUrl || '',
                          title: target.filename,
                          index: nextIdx
                        };
                      });
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/90 border border-white/20 text-white cursor-pointer transition shadow-lg"
                    title="Next image (→ Arrow key)"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
