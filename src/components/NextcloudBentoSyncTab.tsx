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
  Settings
} from 'lucide-react';
import { Track, NextcloudFolderAsset, NextcloudAssetCategory, NextcloudSyncConfig } from '../types';
import {
  getSavedNextcloudAssets,
  saveNextcloudAssets,
  getSavedNextcloudConfig,
  saveNextcloudConfig,
  autoMatchAssetToCatalog,
  INITIAL_FOLDER_207332_ASSETS,
  DEFAULT_NEXTCLOUD_CONFIG
} from '../data/nextcloudFolderAssets';
import { audioMiniDaw } from '../utils/audioEngine';
import { HelpCircle } from 'lucide-react';
import { SectionQuickHelpBanner } from './SectionQuickHelpBanner';

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
  const [assets, setAssets] = useState<NextcloudFolderAsset[]>(() => getSavedNextcloudAssets(tracks));
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'MASTERS' | 'STEMS' | 'VISUALS' | 'DOCS' | 'MATCHED' | 'UNMATCHED'>('ALL');
  const [activeSubfolder, setActiveSubfolder] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

  // Audio Stem Preview
  const [playingAssetId, setPlayingAssetId] = useState<string | null>(null);
  const [copiedPill, setCopiedPill] = useState('');

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
          if (existing) {
            return {
              ...existing,
              fileSizeBytes: file.size || existing.fileSizeBytes,
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

          return {
            id: `NC-LIVE-${Date.now()}-${idx}`,
            filename: file.name,
            folderId: '207332',
            category: guessedCat,
            fileSizeBytes: file.size || 0,
            fileSizeFormatted: `${Math.round((file.size || 0) / 1024 / 1024)} MB`,
            mimeType: file.mimeType || 'application/octet-stream',
            webdavPath: file.href || `/remote.php/dav/files/ncted/Music-Production/${file.name}`,
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

  // 6. Audition stem audio
  const handleToggleAudition = (asset: NextcloudFolderAsset) => {
    if (playingAssetId === asset.id) {
      audioMiniDaw.stopPlayback();
      setPlayingAssetId(null);
    } else {
      audioMiniDaw.stopPlayback();
      const bpm = asset.bpm || 80;
      const type =
        asset.category === 'UVR5_VOCAL_STEM'
          ? 'vocal'
          : asset.category === 'INSTRUMENTAL_STEM'
          ? 'instrumental'
          : 'master';

      audioMiniDaw.startPlayback(
        [
          {
            id: 1,
            name: asset.filename,
            vol: 90,
            pan: 0,
            muted: false,
            solo: true,
            trimIn: 0,
            trimOut: 120,
            freq: type === 'vocal' ? 220 : 110,
            waveType: type === 'vocal' ? 'triangle' : 'sine',
            color: '#6366f1'
          }
        ],
        bpm
      );
      setPlayingAssetId(asset.id);
    }
  };

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
              href="https://nextcloud.moyercloud.com/index.php/apps/files/files/207332?dir=/Music-Production"
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
        {/* Left: File Explorer & Audio Audition List (Col 7) */}
        <div className="lg:col-span-7 space-y-2.5">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1 font-mono">
            <span>Showing {filteredAssets.length} of {totalCount} files in /Music-Production</span>
            <span>Active Project: <strong className={isDarkMode ? 'text-indigo-300' : 'text-indigo-700'}>{selectedTrack.id} ({selectedTrack.title})</strong></span>
          </div>

          {filteredAssets.length === 0 ? (
            <div className={`p-8 rounded-2xl border text-center space-y-2 ${
              isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'
            }`}>
              <Folder className="w-8 h-8 text-slate-400 mx-auto" />
              <p className={`text-sm font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                No files found in /Music-Production matching filter
              </p>
              <p className="text-xs text-slate-400">Click "All Categories" or clear the search query.</p>
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
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'ring-2 ring-indigo-500 border-indigo-500 shadow-md'
                      : isDarkMode
                      ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                      : 'bg-white border-slate-200 hover:border-indigo-300 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      {/* File Icon */}
                      <div
                        className={`p-2.5 rounded-xl flex-shrink-0 ${
                          asset.category === 'MASTER_AUDIO'
                            ? isDarkMode ? 'bg-cyan-950 text-cyan-400 border border-cyan-800/40' : 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                            : asset.category === 'UVR5_VOCAL_STEM'
                            ? isDarkMode ? 'bg-purple-950 text-purple-400 border border-purple-800/40' : 'bg-purple-50 text-purple-700 border border-purple-200'
                            : asset.category === 'INSTRUMENTAL_STEM'
                            ? isDarkMode ? 'bg-indigo-950 text-indigo-400 border border-indigo-800/40' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            : asset.category === 'VISUAL_ARTWORK'
                            ? isDarkMode ? 'bg-amber-950 text-amber-400 border border-amber-800/40' : 'bg-amber-50 text-amber-700 border border-amber-200'
                            : asset.category === 'VIDEO_REEL'
                            ? isDarkMode ? 'bg-rose-950 text-rose-400 border border-rose-800/40' : 'bg-rose-50 text-rose-700 border border-rose-200'
                            : asset.category === 'LYRIC_SOP_DOC'
                            ? isDarkMode ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : isDarkMode ? 'bg-slate-800 text-slate-400 border border-slate-700' : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {isAudio ? (
                          <Music className="w-4 h-4" />
                        ) : asset.category === 'VISUAL_ARTWORK' ? (
                          <ImageIcon className="w-4 h-4" />
                        ) : asset.category === 'VIDEO_REEL' ? (
                          <Video className="w-4 h-4" />
                        ) : (
                          <FileText className="w-4 h-4" />
                        )}
                      </div>

                      <div className="min-w-0 space-y-1">
                        <div className={`font-bold text-xs truncate max-w-sm sm:max-w-md ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                          {asset.filename}
                        </div>

                        {/* Relative Path inside /Music-Production */}
                        <div className="text-[10px] font-mono text-slate-400 truncate flex items-center gap-1">
                          <Folder className="w-2.5 h-2.5 text-indigo-400 shrink-0" />
                          <span>/Music-Production/{relativeDisplayPath}</span>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap text-[10px] font-mono text-slate-400 pt-0.5">
                          <span>{asset.fileSizeFormatted}</span>
                          <span>•</span>
                          <span
                            className={`px-1.5 py-0.2 rounded font-bold uppercase text-[9px] ${
                              asset.category === 'MASTER_AUDIO'
                                ? 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-300'
                                : asset.category === 'UVR5_VOCAL_STEM'
                                ? 'bg-purple-500/20 text-purple-600 dark:text-purple-300'
                                : asset.category === 'INSTRUMENTAL_STEM'
                                ? 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-300'
                                : asset.category === 'VISUAL_ARTWORK'
                                ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300'
                                : asset.category === 'VIDEO_REEL'
                                ? 'bg-rose-500/20 text-rose-600 dark:text-rose-300'
                                : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300'
                            }`}
                          >
                            {asset.category.replace(/_/g, ' ')}
                          </span>

                          {asset.bpm && (
                            <>
                              <span>•</span>
                              <span className="text-cyan-500 font-bold">{asset.bpm} BPM</span>
                            </>
                          )}
                          {asset.key && (
                            <>
                              <span>•</span>
                              <span className="text-amber-500 font-bold">{asset.key}</span>
                            </>
                          )}
                        </div>

                        {/* Matched Track Indicator */}
                        <div className="pt-0.5 flex items-center gap-1.5 flex-wrap">
                          {asset.isMatched && asset.matchedTrackId ? (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                              isDarkMode
                                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800/40'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            }`}>
                              <CheckCircle className="w-3 h-3 text-emerald-500" />
                              <span>Matched: {asset.matchedTrackId} ({asset.matchedTrackTitle})</span>
                              <span className="text-emerald-600 font-mono">[{asset.matchConfidence}%]</span>
                            </span>
                          ) : (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                              isDarkMode
                                ? 'bg-amber-950/80 text-amber-300 border-amber-800/40'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}>
                              <AlertCircle className="w-3 h-3 text-amber-500" />
                              <span>Suggest: {asset.suggestedTrackId || 'None'}</span>
                              {asset.matchConfidence > 0 && (
                                <span className="text-amber-600 font-mono">[{asset.matchConfidence}%]</span>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quick Row Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                      {isAudio && (
                        <button
                          type="button"
                          onClick={() => handleToggleAudition(asset)}
                          className={`p-2 rounded-xl transition cursor-pointer ${
                            playingAssetId === asset.id
                              ? 'bg-cyan-500 text-slate-950 font-bold'
                              : isDarkMode
                              ? 'bg-slate-800 hover:bg-slate-700 text-cyan-300'
                              : 'bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border border-cyan-200'
                          }`}
                          title={playingAssetId === asset.id ? 'Pause Preview' : 'Audition Stem Preview'}
                        >
                          {playingAssetId === asset.id ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => copyText(asset.webdavPath, 'WebDAV Path')}
                        className={`p-2 rounded-xl transition cursor-pointer ${
                          isDarkMode
                            ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                        title="Copy WebDAV Path"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      <a
                        href={asset.shareUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={`p-2 rounded-xl transition cursor-pointer ${
                          isDarkMode
                            ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                        title="Open file directly in Nextcloud /Music-Production"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right: File Inspector & Track Linker Workbench (Col 5) */}
        <div className="lg:col-span-5">
          {currentAsset ? (
            <div
              className={`p-4 sm:p-5 rounded-3xl border sticky top-20 space-y-3.5 ${
                isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
              }`}
            >
              <div className={`flex items-center justify-between pb-2.5 border-b ${
                isDarkMode ? 'border-slate-800/60' : 'border-slate-200'
              }`}>
                <div className="flex items-center gap-2 min-w-0">
                  <Tag className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                  <h3 className={`text-xs font-bold uppercase tracking-wider truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    /Music-Production File Details
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-400">ID: {currentAsset.id}</span>
              </div>

              {/* Visual Preview if Image or Video */}
              {currentAsset.previewImageUrl && (
                <div className="relative rounded-2xl overflow-hidden border border-slate-800 aspect-video group">
                  <img
                    src={currentAsset.previewImageUrl}
                    alt={currentAsset.filename}
                    className="w-full h-full object-cover group-hover:scale-105 transition"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent flex items-end p-3 text-xs text-white">
                    <span className="font-bold truncate">{currentAsset.filename}</span>
                  </div>
                </div>
              )}

              {/* Filename & Info */}
              <div className="space-y-1">
                <div className={`text-xs font-bold break-all ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  {currentAsset.filename}
                </div>
                <div className="text-[10px] font-mono text-indigo-400 break-all bg-indigo-950/30 p-2 rounded-xl border border-indigo-800/30">
                  {currentAsset.webdavPath}
                </div>
                <p className={`text-[11px] leading-relaxed pt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  {currentAsset.notes}
                </p>
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

              {/* Track Matching Dropdown */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-mono uppercase font-bold text-slate-400 block">
                    Link to Master Track:
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

                <select
                  value={currentAsset.matchedTrackId || ''}
                  onChange={e => handleAssignTrack(currentAsset.id, e.target.value || null)}
                  className={`w-full p-2 rounded-xl border text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
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
              </div>

              {/* Action Buttons */}
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
                  href="https://nextcloud.moyercloud.com/index.php/apps/files/files/207332?dir=/Music-Production"
                  target="_blank"
                  rel="noreferrer"
                  className={`w-full py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    isDarkMode
                      ? 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-indigo-400 hover:text-white'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-indigo-700 hover:text-indigo-900'
                  }`}
                >
                  <HardDrive className="w-3.5 h-3.5" />
                  <span>Open /Music-Production in Nextcloud</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
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
    </div>
  );
};
