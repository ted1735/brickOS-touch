import React, { useState, useMemo } from 'react';
import {
  Layers,
  HardDrive,
  Copy,
  Check,
  Download,
  Terminal,
  ExternalLink,
  Tag,
  Music,
  Image as ImageIcon,
  Film,
  Sparkles,
  Link2,
  Table,
  CheckCircle2,
  Mic,
  Shield,
  FileJson,
  Sliders,
  FolderSync,
  Play,
  Square,
  Volume2,
  ArrowUpDown,
  Filter,
  Search,
  Zap,
  Activity,
  Plus,
  RefreshCw,
  HelpCircle,
  Folder,
  Radio
} from 'lucide-react';
import { Track, InterchangeableAssetLink } from '../types';
import { SectionQuickHelpBanner } from './SectionQuickHelpBanner';
import {
  PRODUCTION_NEXTCLOUD_WEBDAV,
  PRODUCTION_NEXTCLOUD_BASE,
  DEFAULT_WEBDAV_USER,
  OFFICIAL_VOCAL_ARCHETYPES,
  INTERCHANGEABLE_ASSET_MATRIX,
  getTrackStems,
  getTrackVisualAssets,
  generateCatalogJsonManifest,
  generateCurlStemUploadCommand,
  generateRcloneConfigBlock,
  generateRcloneSyncCommand,
  generateWindowsDriveMountCommand
} from '../data/relationalCatalogBridge';
import { rankCatalogMatches, parseCamelot, TrackMatchResult } from '../utils/harmonicMatcher';
import { audioMiniDaw } from '../utils/audioEngine';

interface RelationalDatabaseAndMatrixTabProps {
  tracks: Track[];
  selectedTrack: Track;
  onSelectTrack: (track: Track) => void;
  onCopyText: (text: string, label: string) => void;
  onOpenSectionGuide?: (sectionId?: any) => void;
  isDarkMode?: boolean;
  isDbConnected?: boolean;
  isDbSyncing?: boolean;
  onSyncDatabase?: () => void;
}

export const RelationalDatabaseAndMatrixTab: React.FC<RelationalDatabaseAndMatrixTabProps> = ({
  tracks,
  selectedTrack,
  onSelectTrack,
  onCopyText,
  onOpenSectionGuide,
  isDarkMode = true,
  isDbConnected = true,
  isDbSyncing = false,
  onSyncDatabase
}) => {
  // Navigation Subviews
  const [activeSubView, setActiveSubView] = useState<
    'cross_matcher' | 'matrix' | 'resolver' | 'vocal_archetypes' | 'json_sync' | 'daw_helpers' | 'schema'
  >('cross_matcher');

  // Matcher filters & state
  const [matcherFilter, setMatcherFilter] = useState<'ALL' | 'HARMONIC' | 'BPM' | 'VOCAL' | 'EP'>('ALL');
  const [matcherSearch, setMatcherSearch] = useState<string>('');
  const [auditioningTrackId, setAuditioningTrackId] = useState<string | null>(null);

  // Interchangeable Matrix State (local storage backed for custom links)
  const [assetMatrix, setAssetMatrix] = useState<InterchangeableAssetLink[]>(() => {
    try {
      const saved = localStorage.getItem('brickos_interchangeable_asset_matrix');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return INTERCHANGEABLE_ASSET_MATRIX;
  });

  const [selectedClusterFilter, setSelectedClusterFilter] = useState<string>('ALL');
  const [matrixSearch, setMatrixSearch] = useState<string>('');
  const [isCopiedJson, setIsCopiedJson] = useState<boolean>(false);
  const [isNewLinkModalOpen, setIsNewLinkModalOpen] = useState<boolean>(false);
  const [newLinkTitle, setNewLinkTitle] = useState<string>('');
  const [newLinkCategory, setNewLinkCategory] = useState<'VISUAL' | 'AUDIO_STEM' | 'MIDI_CHORD' | 'DOCUMENT'>('AUDIO_STEM');
  const [newLinkCluster, setNewLinkCluster] = useState<string>('#Theme_SanctuaryCross');
  const [newLinkTargetTrack, setNewLinkTargetTrack] = useState<string>(tracks[0]?.id || 'TRK-01');

  // Dynamic ranking of all other catalog songs against selectedTrack
  const rankedMatches = useMemo(() => {
    return rankCatalogMatches(selectedTrack, tracks);
  }, [selectedTrack, tracks]);

  // Filtered matches for Cross-Matcher view
  const filteredMatches = useMemo(() => {
    return rankedMatches.filter((item) => {
      // Category filter
      if (matcherFilter === 'HARMONIC' && item.harmonicScore < 85) return false;
      if (matcherFilter === 'BPM' && item.bpmScore < 85) return false;
      if (matcherFilter === 'VOCAL' && item.vocalScore < 80) return false;
      if (matcherFilter === 'EP' && item.track.ep !== selectedTrack.ep) return false;

      // Text query
      if (matcherSearch) {
        const q = matcherSearch.toLowerCase();
        const matchesTitle = item.track.title.toLowerCase().includes(q);
        const matchesId = item.track.id.toLowerCase().includes(q);
        const matchesVocal = item.track.vocal.toLowerCase().includes(q);
        const matchesKey = item.track.key.toLowerCase().includes(q);
        const matchesThesis = item.track.thesis.toLowerCase().includes(q);
        return matchesTitle || matchesId || matchesVocal || matchesKey || matchesThesis;
      }
      return true;
    });
  }, [rankedMatches, matcherFilter, matcherSearch, selectedTrack.ep]);

  // Filtered interchangeable pool
  const filteredMatrix = useMemo(() => {
    return assetMatrix.filter((item) => {
      const matchesCluster =
        selectedClusterFilter === 'ALL' || item.themeCluster === selectedClusterFilter;
      const matchesSearch =
        !matrixSearch ||
        item.title.toLowerCase().includes(matrixSearch.toLowerCase()) ||
        item.similarityTags.some((t) => t.toLowerCase().includes(matrixSearch.toLowerCase())) ||
        item.compatibleTracks.some((t) => t.toLowerCase().includes(matrixSearch.toLowerCase()));
      return matchesCluster && matchesSearch;
    });
  }, [assetMatrix, selectedClusterFilter, matrixSearch]);

  const activeStems = useMemo(() => getTrackStems(selectedTrack.id), [selectedTrack.id]);
  const activeVisuals = useMemo(() => getTrackVisualAssets(selectedTrack), [selectedTrack]);
  const selectedCamelot = useMemo(() => parseCamelot(selectedTrack.key), [selectedTrack.key]);
  const generatedJson = useMemo(() => generateCatalogJsonManifest(tracks), [tracks]);

  // Audition playback trigger
  const handleToggleAudition = (track: Track) => {
    if (auditioningTrackId === track.id) {
      audioMiniDaw.stopPlayback();
      setAuditioningTrackId(null);
    } else {
      audioMiniDaw.stopPlayback();
      const bpm = track.bpm || 80;
      audioMiniDaw.startPlayback(
        [
          {
            id: 1,
            name: `${track.title} (Instrumental)`,
            vol: 85,
            pan: -15,
            muted: false,
            solo: false,
            trimIn: 0,
            trimOut: 120,
            freq: 110,
            waveType: 'sawtooth',
            color: '#6366f1'
          },
          {
            id: 2,
            name: `${track.title} (Lead Vocal Formant)`,
            vol: 90,
            pan: 15,
            muted: false,
            solo: false,
            trimIn: 0,
            trimOut: 120,
            freq: 220,
            waveType: 'triangle',
            color: '#10b981'
          }
        ],
        bpm
      );
      setAuditioningTrackId(track.id);
    }
  };

  // Add real link between current track and matched track
  const handleCreateCrossLink = (matchedTrack: Track) => {
    const newLink: InterchangeableAssetLink = {
      id: `SIM-CUSTOM-${Date.now().toString().slice(-4)}`,
      primaryTrackId: selectedTrack.id,
      title: `${selectedTrack.title} ↔ ${matchedTrack.title} Cross-Asset Link`,
      assetCategory: 'CROSS_CATALOG_SHARED',
      assetType: 'AUDIO_STEM',
      themeCluster: 'CrossCatalog_BRoll',
      webdavRelativePath: `Music-Production/${selectedTrack.id}/stems/${selectedTrack.id}_Master_24bit_48k.wav`,
      fullWebdavUrl: `${PRODUCTION_NEXTCLOUD_WEBDAV}/${selectedTrack.id}/stems/${selectedTrack.id}_Master_24bit_48k.wav`,
      similarityTags: [`#Key_${selectedCamelot.code}`, `#BPM_${selectedTrack.bpm}`, `#Compatible_${matchedTrack.id}`],
      compatibleTracks: [selectedTrack.id, matchedTrack.id],
      description: `Harmonically paired stems (${selectedCamelot.code} / ${selectedTrack.bpm} BPM) shared between ${selectedTrack.title} and ${matchedTrack.title}.`
    };

    const updated = [newLink, ...assetMatrix];
    setAssetMatrix(updated);
    try {
      localStorage.setItem('brickos_interchangeable_asset_matrix', JSON.stringify(updated));
    } catch {
      // ignore
    }
    onCopyText(`Linked "${selectedTrack.title}" with "${matchedTrack.title}" in Cross-Asset Pool`, 'Asset Link Created');
  };

  const handleCopyJson = () => {
    onCopyText(generatedJson, 'Catalog JSON Backup');
    setIsCopiedJson(true);
    setTimeout(() => setIsCopiedJson(false), 3000);
  };

  const handleDownloadJson = () => {
    const blob = new Blob([generatedJson], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `brickos_catalog_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* SECTION QUICK HELP BANNER & SOP GUIDE */}
      <SectionQuickHelpBanner
        sectionId="database"
        onOpenModalGuide={(sec) => onOpenSectionGuide?.(sec || 'database')}
        isDarkMode={isDarkMode}
      />

      {/* TOP HEADER & CATALOG GRAPH STATUS */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden shadow-xl">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 font-mono text-xs font-bold border border-cyan-700/50 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                Master Catalog & Asset Cross-Matching Matrix
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 font-mono text-xs font-semibold border border-emerald-700/40 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Nextcloud WebDAV Active (207332)
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 font-mono text-xs font-semibold border border-amber-700/40">
                26 Master Tracks Mapped
              </span>
            </div>
            <h2 className="text-xl font-black text-white tracking-wide">
              Master Catalog & Cross-Asset Matching Matrix
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
              Real-time harmonic Camelot key analysis, BPM compatibility ranking, vocal archetype pairing, and live Nextcloud WebDAV stem resolution for your 26 songs.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {onOpenSectionGuide && (
              <button
                type="button"
                onClick={() => onOpenSectionGuide('database')}
                className="px-4 py-2 rounded-xl bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 font-bold text-xs border border-amber-700/50 flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                title="Open Master Catalog & Matrix Guide & SOP Rules"
              >
                <HelpCircle className="w-4 h-4 text-amber-400" />
                <span>How To Use Catalog & Matrix</span>
              </button>
            )}

            <button
              onClick={handleCopyJson}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-950 transition cursor-pointer"
              title="Copy clean JSON backup of all 26 songs and stems"
            >
              {isCopiedJson ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{isCopiedJson ? 'Copied Catalog JSON!' : 'Copy Catalog JSON'}</span>
            </button>
            <button
              onClick={handleDownloadJson}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 flex items-center gap-2 transition cursor-pointer"
              title="Download brickos_catalog_backup.json"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              <span>Download .json Backup</span>
            </button>
          </div>
        </div>

        {/* Selected Track Reference Strip */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/70">
            <span className="text-[10px] text-slate-500 uppercase font-mono block">Reference Track</span>
            <span className="text-xs font-bold text-white truncate block">{selectedTrack.id}: {selectedTrack.title}</span>
          </div>

          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/70">
            <span className="text-[10px] text-slate-500 uppercase font-mono block">Musical Key & Camelot</span>
            <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5 font-mono">
              <span>{selectedTrack.key}</span>
              <span className="px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 text-[10px] border border-cyan-800/50">
                {selectedCamelot.code}
              </span>
            </span>
          </div>

          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/70">
            <span className="text-[10px] text-slate-500 uppercase font-mono block">Official Tempo</span>
            <span className="text-xs font-bold text-emerald-400 font-mono">{selectedTrack.bpm} BPM</span>
          </div>

          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/70">
            <span className="text-[10px] text-slate-500 uppercase font-mono block">Vocal Archetype</span>
            <span className="text-xs font-bold text-purple-300 truncate block">{selectedTrack.vocal}</span>
          </div>

          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/70">
            <span className="text-[10px] text-slate-500 uppercase font-mono block">Active Stems</span>
            <span className="text-xs font-bold text-amber-300 font-mono">4 Stems (24b/48k)</span>
          </div>

          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/70 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-mono block">Quick Switch</span>
              <select
                value={selectedTrack.id}
                onChange={(e) => {
                  const target = tracks.find(t => t.id === e.target.value);
                  if (target) onSelectTrack(target);
                }}
                className="bg-transparent text-xs font-bold text-indigo-400 focus:outline-hidden cursor-pointer"
              >
                {tracks.map(t => (
                  <option key={t.id} value={t.id} className="bg-slate-900 text-white">
                    {t.id}: {t.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* SUB-VIEW NAVIGATION TABS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
        <button
          onClick={() => setActiveSubView('cross_matcher')}
          className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
            activeSubView === 'cross_matcher'
              ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-md shadow-cyan-950'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4 text-cyan-300" />
          <span>Dynamic Cross-Matcher (Harmonic & BPM)</span>
          <span className="px-1.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 text-[10px] border border-cyan-800/40">
            25 Matches
          </span>
        </button>

        <button
          onClick={() => setActiveSubView('matrix')}
          className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
            activeSubView === 'matrix'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-950'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Layers className="w-4 h-4 text-purple-400" />
          <span>Interchangeable Asset Pool ({assetMatrix.length})</span>
        </button>

        <button
          onClick={() => setActiveSubView('resolver')}
          className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
            activeSubView === 'resolver'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-950'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Link2 className="w-4 h-4 text-emerald-400" />
          <span>WebDAV Asset Resolver ({selectedTrack.id})</span>
        </button>

        <button
          onClick={() => setActiveSubView('vocal_archetypes')}
          className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
            activeSubView === 'vocal_archetypes'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-950'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Mic className="w-4 h-4 text-amber-400" />
          <span>Vocal Archetypes (8 Profiles)</span>
        </button>

        <button
          onClick={() => setActiveSubView('json_sync')}
          className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
            activeSubView === 'json_sync'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-950'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <FileJson className="w-4 h-4 text-emerald-400" />
          <span>Catalog JSON Backup & Schema</span>
        </button>

        <button
          onClick={() => setActiveSubView('daw_helpers')}
          className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
            activeSubView === 'daw_helpers'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-950'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Terminal className="w-4 h-4 text-pink-400" />
          <span>DAW & CLI Helpers (cURL, rclone, net use)</span>
        </button>

        <button
          onClick={() => setActiveSubView('schema')}
          className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
            activeSubView === 'schema'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-950'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Table className="w-4 h-4 text-blue-400" />
          <span>Catalog Architecture</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. DYNAMIC CROSS-MATCHER (HARMONIC & BPM COMPATIBILITY ENGINE) */}
      {/* ========================================================================= */}
      {activeSubView === 'cross_matcher' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-md">
            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
              <span className="text-xs text-slate-400 font-bold uppercase font-mono mr-1">Filter Matches:</span>
              <button
                onClick={() => setMatcherFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  matcherFilter === 'ALL'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                All 25 Songs
              </button>
              <button
                onClick={() => setMatcherFilter('HARMONIC')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  matcherFilter === 'HARMONIC'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                Harmonic Lock (≥85%)
              </button>
              <button
                onClick={() => setMatcherFilter('BPM')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  matcherFilter === 'BPM'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                BPM Lock / Half-Time
              </button>
              <button
                onClick={() => setMatcherFilter('VOCAL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  matcherFilter === 'VOCAL'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                Same Vocalist ({selectedTrack.vocal})
              </button>
              <button
                onClick={() => setMatcherFilter('EP')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  matcherFilter === 'EP'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                Same EP
              </button>
            </div>

            <div className="relative w-full md:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search matching title, key..."
                value={matcherSearch}
                onChange={(e) => setMatcherSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-500 font-mono"
              />
            </div>
          </div>

          {/* Active Reference Banner */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-cyan-950/40 via-indigo-950/30 to-slate-900 border border-cyan-800/40 flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-cyan-300">Comparing Against:</span>
              <span className="font-bold text-white">{selectedTrack.id}: {selectedTrack.title}</span>
              <span className="px-2 py-0.5 rounded-md bg-cyan-950 text-cyan-400 font-mono text-[11px] border border-cyan-700/50">
                {selectedTrack.key} ({selectedCamelot.code}) • {selectedTrack.bpm} BPM
              </span>
            </div>
            <span className="text-slate-400 text-[11px]">
              Showing {filteredMatches.length} sorted by compatibility score (Harmonic Key 45% + BPM 35% + Vocal 10% + Theme 10%)
            </span>
          </div>

          {/* Ranked Matches Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMatches.map((match) => {
              const isTop = match.overallScore >= 85;
              const isPlaying = auditioningTrackId === match.track.id;

              return (
                <div
                  key={match.track.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isTop
                      ? 'bg-slate-900/90 border-cyan-500/40 shadow-lg shadow-cyan-950/20'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono font-bold text-cyan-400">{match.track.id}</span>
                        <h4 className="text-sm font-black text-white">{match.track.title}</h4>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                          {match.track.ep.split(':')[0]}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 italic line-clamp-1">"{match.track.thesis}"</p>
                    </div>

                    {/* Overall Score Badge */}
                    <div className="text-right flex-shrink-0">
                      <div className={`px-2.5 py-1 rounded-xl font-mono font-bold text-xs flex items-center gap-1.5 ${
                        match.overallScore >= 85
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50'
                          : match.overallScore >= 70
                          ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                          : 'bg-slate-950 text-slate-400 border border-slate-800'
                      }`}>
                        <span>{match.overallScore}%</span>
                        <span className="text-[10px] opacity-75">Match</span>
                      </div>
                    </div>
                  </div>

                  {/* Compatibility Meters */}
                  <div className="mt-3.5 grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-slate-400">Harmonic Key</span>
                        <span className="text-cyan-300 font-bold">{match.camelotB} ({match.track.key})</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-1">
                        <div
                          className="bg-cyan-400 h-full rounded-full transition-all"
                          style={{ width: `${match.harmonicScore}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 block truncate">{match.harmonicRelation}</span>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-slate-400">Tempo (BPM)</span>
                        <span className="text-emerald-400 font-bold">{match.track.bpm} BPM</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-1">
                        <div
                          className="bg-emerald-400 h-full rounded-full transition-all"
                          style={{ width: `${match.bpmScore}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 block truncate">{match.bpmRelation}</span>
                    </div>
                  </div>

                  {/* Compatible Stem Suggestions */}
                  <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] uppercase font-bold text-slate-500 font-mono">Usable Stems:</span>
                      {match.compatibleStems.map((stem, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md bg-indigo-950/70 text-indigo-300 text-[10px] font-mono border border-indigo-800/50"
                        >
                          {stem}
                        </span>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleAudition(match.track)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                          isPlaying
                            ? 'bg-rose-600 text-white'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        }`}
                        title="Audition stem preview with Web Audio Mini-DAW"
                      >
                        {isPlaying ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
                        <span>{isPlaying ? 'Stop' : 'Audition'}</span>
                      </button>

                      <button
                        onClick={() => handleCreateCrossLink(match.track)}
                        className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                        title="Link as reusable cross-asset pair"
                      >
                        <Link2 className="w-3.5 h-3.5" />
                        <span>Link Asset</span>
                      </button>

                      <button
                        onClick={() => onSelectTrack(match.track)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer"
                        title="Switch reference track to this song"
                      >
                        <span>Select</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. INTERCHANGEABLE ASSET SIMILARITY POOL */}
      {/* ========================================================================= */}
      {activeSubView === 'matrix' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-md">
            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
              <span className="text-xs text-slate-400 font-bold uppercase font-mono mr-1">Cluster:</span>
              <button
                onClick={() => setSelectedClusterFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  selectedClusterFilter === 'ALL'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                All Assets ({assetMatrix.length})
              </button>
              <button
                onClick={() => setSelectedClusterFilter('Theme_SanctuaryCross')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  selectedClusterFilter === 'Theme_SanctuaryCross'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                #SanctuaryCross (TRK 1, 3, 4, 24)
              </button>
              <button
                onClick={() => setSelectedClusterFilter('Theme_BlueCollarGrit')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  selectedClusterFilter === 'Theme_BlueCollarGrit'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                #BlueCollarGrit (TRK 7, 9, 13, 14)
              </button>
              <button
                onClick={() => setSelectedClusterFilter('CrossCatalog_BRoll')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  selectedClusterFilter === 'CrossCatalog_BRoll'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                #CrossCatalog B-Roll
              </button>
            </div>

            <div className="relative w-full md:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search matrix tags, tracks..."
                value={matrixSearch}
                onChange={(e) => setMatrixSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMatrix.map((item) => (
              <div
                key={item.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 space-y-3 transition shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-700/50">
                        {item.id}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-950 text-purple-300 border border-purple-700/50">
                        {item.themeCluster}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300">
                        {item.assetType}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white">{item.title}</h4>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{item.description}</p>

                {/* Nextcloud Live Path */}
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase block font-bold">WebDAV Target URI</span>
                  <p className="text-cyan-300 truncate select-all">{item.fullWebdavUrl}</p>
                </div>

                {/* Compatible Tracks */}
                <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-800/80">
                  <span className="text-[10px] text-slate-400 font-bold uppercase font-mono mr-1">
                    Compatible Tracks:
                  </span>
                  {item.compatibleTracks.map((trkId) => (
                    <button
                      key={trkId}
                      onClick={() => {
                        const trk = tracks.find((t) => t.id === trkId);
                        if (trk) onSelectTrack(trk);
                      }}
                      className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border transition cursor-pointer ${
                        selectedTrack.id === trkId
                          ? 'bg-amber-500 text-black border-amber-400 font-black'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                      }`}
                      title={`Jump to ${trkId}`}
                    >
                      {trkId}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. DYNAMIC WEBDAV ASSET RESOLVER */}
      {/* ========================================================================= */}
      {activeSubView === 'resolver' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Link2 className="w-4 h-4 text-emerald-400" />
                <span>Resolved Nextcloud WebDAV URIs for {selectedTrack.id} ({selectedTrack.title})</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Zero third-party cloud leakage. All master 24-bit/48kHz WAV audio passes and high-resolution visual art assets resolve directly to your self-hosted Nextcloud server.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={`https://nextcloud.mermaid-symmetric.ts.net/index.php/apps/files/files/207332?dir=/Music-Production/${selectedTrack.id}`}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
              >
                <span>Open Nextcloud Folder</span>
                <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
              </a>
            </div>
          </div>

          {/* Stems Resolver Cards */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Music className="w-4 h-4 text-indigo-400" />
              <span>24-bit / 48kHz Audio Stems ({activeStems.length} Passes)</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeStems.map((stem) => (
                <div key={stem.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs font-mono">{stem.passType.replace(/_/g, ' ')}</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-mono text-[10px] font-bold border border-emerald-700/40">
                      24-bit / 48kHz
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 font-mono">{stem.modelUsed}</p>

                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Live WebDAV URI:</span>
                    <p className="text-cyan-300 truncate select-all">{stem.fullWebdavUrl}</p>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-500 font-mono text-[11px]">Size: ~{(stem.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB</span>
                    <button
                      onClick={() => onCopyText(stem.fullWebdavUrl, 'WebDAV Stem URL')}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3 h-3 text-cyan-400" />
                      <span>Copy Path</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Visual Assets Resolver Cards */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-purple-400" />
              <span>Resolved Visual Assets ({activeVisuals.length} Formats)</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {activeVisuals.map((vis) => (
                <div key={vis.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">{vis.assetType.replace(/_/g, ' ')}</span>
                    <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 font-mono text-[10px] font-bold border border-purple-700/40">
                      {vis.aspectRatio}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-2 italic">"{vis.prompt}"</p>

                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Live WebDAV URI:</span>
                    <p className="text-cyan-300 truncate select-all">{vis.fullWebdavUrl}</p>
                  </div>

                  <div className="flex items-center justify-end text-xs pt-1">
                    <button
                      onClick={() => onCopyText(vis.fullWebdavUrl, 'Visual WebDAV URL')}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3 h-3 text-purple-400" />
                      <span>Copy Path</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. VOCAL ARCHETYPES ROSTER */}
      {/* ========================================================================= */}
      {activeSubView === 'vocal_archetypes' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Mic className="w-4 h-4 text-purple-400" />
              <span>Official Vocal Archetypes (Formant & Acoustic Textures)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Every track in the catalog is relationally bound to its official vocal profile to preserve sonic identity, microphone modeling, and harmonic frequency balance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {OFFICIAL_VOCAL_ARCHETYPES.map((arch) => {
              const assignedTracks = tracks.filter((t) => t.vocal.toLowerCase().includes(arch.name.toLowerCase()));
              return (
                <div key={arch.name} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-md">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-white">{arch.name}</span>
                        <span className="px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 font-mono text-[10px] font-bold border border-purple-700/50">
                          {arch.archetypeTitle}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-400 mt-0.5">{arch.role}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-xl bg-slate-950 text-cyan-300 font-mono text-xs font-bold border border-slate-800">
                      {assignedTracks.length} Songs
                    </span>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase font-bold font-mono block">Formant Texture:</span>
                    <p className="text-slate-300 font-mono text-[11px] leading-relaxed">{arch.formantTexture}</p>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-800/80">
                    <span className="text-[10px] text-slate-500 font-bold uppercase font-mono mr-1">Assigned Tracks:</span>
                    {assignedTracks.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => onSelectTrack(t)}
                        className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border transition cursor-pointer ${
                          selectedTrack.id === t.id
                            ? 'bg-amber-500 text-black border-amber-400 font-black'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                        }`}
                      >
                        {t.id}: {t.title}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. CATALOG JSON BACKUP & SCHEMA (DOCUMENT GRAPH EXPORTER) */}
      {/* ========================================================================= */}
      {activeSubView === 'json_sync' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileJson className="w-4 h-4 text-emerald-400" />
                <span>Catalog JSON Sync & Backup Engine (Clean Document Graph)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Generates a clean JSON manifest linking all 26 songs, vocal archetypes, official BPMs, keys, theological theses, UVR5 audio stems, visual assets, and interchangeable similarity links.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyJson}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-950 transition cursor-pointer"
              >
                {isCopiedJson ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                <span>{isCopiedJson ? 'Copied JSON!' : 'Copy Catalog JSON'}</span>
              </button>
              <button
                onClick={handleDownloadJson}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950 transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download .json Backup</span>
              </button>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 overflow-hidden">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-[11px] font-mono text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Format: Pure JSON Schema v2.5 • Document Graph</span>
              </div>
              <span>~{generatedJson.split('\n').length} lines • UTF-8</span>
            </div>
            <pre className="text-xs font-mono text-slate-300 p-3 bg-slate-900/90 rounded-xl overflow-x-auto max-h-[550px] leading-relaxed select-all">
              {generatedJson}
            </pre>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. DAW & CLI HELPERS (cURL, rclone, net use Z:) */}
      {/* ========================================================================= */}
      {activeSubView === 'daw_helpers' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-pink-400" />
              <span>DAW & Network Integration Snippets</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Direct CLI commands to sync 24-bit/48kHz master WAV files and project sessions between your local Cakewalk / DaVinci Resolve workstation and your Nextcloud WebDAV production server.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* cURL upload */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-xs">cURL Upload Stem</span>
                <span className="text-[10px] font-mono text-indigo-400">BASH / CMD</span>
              </div>
              <p className="text-xs text-slate-400">Upload 24-bit/48kHz master directly to {selectedTrack.id} folder:</p>
              <pre className="bg-slate-950 p-3 rounded-xl font-mono text-[11px] text-cyan-300 overflow-x-auto select-all">
                {generateCurlStemUploadCommand(selectedTrack.id, `${selectedTrack.id}_Master_24bit_48k.wav`)}
              </pre>
              <button
                onClick={() => onCopyText(generateCurlStemUploadCommand(selectedTrack.id, `${selectedTrack.id}_Master_24bit_48k.wav`), 'cURL Command')}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5 text-cyan-400" />
                <span>Copy Command</span>
              </button>
            </div>

            {/* Windows Net Use */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-xs">Windows Virtual Drive Mount (Z:)</span>
                <span className="text-[10px] font-mono text-pink-400">WINDOWS CMD</span>
              </div>
              <p className="text-xs text-slate-400">Mount your Nextcloud /Music-Production root as drive Z: inside Cakewalk or Reaper:</p>
              <pre className="bg-slate-950 p-3 rounded-xl font-mono text-[11px] text-pink-300 overflow-x-auto select-all">
                {generateWindowsDriveMountCommand()}
              </pre>
              <button
                onClick={() => onCopyText(generateWindowsDriveMountCommand(), 'Mount Drive Command')}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5 text-pink-400" />
                <span>Copy Mount Command</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. CATALOG ARCHITECTURE & DATA MODEL (DOCUMENT GRAPH SCHEMA) */}
      {/* ========================================================================= */}
      {activeSubView === 'schema' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Table className="w-4 h-4 text-blue-400" />
              <span>Catalog Architecture & Asset Data Model</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Structured document and asset hierarchy linking EPs, master song tracks, versioned lyrics, UVR5 audio stems, visual artwork, and cross-catalog interchangeable asset pools.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* ep_collections */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-white text-xs font-mono">EP Collections</span>
                <span className="text-[10px] font-mono text-indigo-400">COLLECTION</span>
              </div>
              <ul className="text-[11px] font-mono space-y-1 text-slate-300">
                <li className="flex justify-between"><span className="text-amber-400">id</span> <span>string ('EP 1'..'EP 4')</span></li>
                <li className="flex justify-between"><span>title</span> <span>string</span></li>
                <li className="flex justify-between"><span>theme</span> <span>string</span></li>
                <li className="flex justify-between"><span>target_release</span> <span>string</span></li>
              </ul>
            </div>

            {/* vocal_archetypes */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-white text-xs font-mono">Vocal Archetypes</span>
                <span className="text-[10px] font-mono text-purple-400">ROSTER</span>
              </div>
              <ul className="text-[11px] font-mono space-y-1 text-slate-300">
                <li className="flex justify-between"><span className="text-amber-400">name</span> <span>string (Architect, Brandon...)</span></li>
                <li className="flex justify-between"><span>archetype_title</span> <span>string</span></li>
                <li className="flex justify-between"><span>role</span> <span>string</span></li>
                <li className="flex justify-between"><span>formant_texture</span> <span>string</span></li>
              </ul>
            </div>

            {/* master tracks */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-white text-xs font-mono">Master Tracks</span>
                <span className="text-[10px] font-mono text-emerald-400">PRIMARY ENTITY</span>
              </div>
              <ul className="text-[11px] font-mono space-y-1 text-slate-300">
                <li className="flex justify-between"><span className="text-amber-400">id</span> <span>string ('TRK-01'..'TRK-26')</span></li>
                <li className="flex justify-between"><span>title</span> <span>string</span></li>
                <li className="flex justify-between"><span>bpm</span> <span>number</span></li>
                <li className="flex justify-between"><span>musical_key</span> <span>string (Camelot)</span></li>
                <li className="flex justify-between"><span>vocal_archetype</span> <span>string</span></li>
                <li className="flex justify-between"><span>theme_thesis</span> <span>string</span></li>
              </ul>
            </div>

            {/* audio stems */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-white text-xs font-mono">Audio Stems</span>
                <span className="text-[10px] font-mono text-cyan-400">24b/48kHz WAV</span>
              </div>
              <ul className="text-[11px] font-mono space-y-1 text-slate-300">
                <li className="flex justify-between"><span className="text-amber-400">track_id</span> <span>string</span></li>
                <li className="flex justify-between"><span>pass_type</span> <span>string (Instrumental, Dry Vocals...)</span></li>
                <li className="flex justify-between"><span>webdav_url</span> <span>string (Nextcloud)</span></li>
                <li className="flex justify-between"><span>sample_rate</span> <span>48000 Hz</span></li>
                <li className="flex justify-between"><span>bit_depth</span> <span>24-bit</span></li>
              </ul>
            </div>

            {/* visual assets */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-white text-xs font-mono">Visual Assets</span>
                <span className="text-[10px] font-mono text-pink-400">IMAGE & VIDEO</span>
              </div>
              <ul className="text-[11px] font-mono space-y-1 text-slate-300">
                <li className="flex justify-between"><span className="text-amber-400">track_id</span> <span>string</span></li>
                <li className="flex justify-between"><span>aspect_ratio</span> <span>string ('1:1', '9:16', '16:9')</span></li>
                <li className="flex justify-between"><span>webdav_url</span> <span>string</span></li>
                <li className="flex justify-between"><span>prompt</span> <span>string</span></li>
              </ul>
            </div>

            {/* interchangeable pool */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-white text-xs font-mono">Interchangeable Pool</span>
                <span className="text-[10px] font-mono text-amber-400">CROSS-MATCHING</span>
              </div>
              <ul className="text-[11px] font-mono space-y-1 text-slate-300">
                <li className="flex justify-between"><span className="text-amber-400">id</span> <span>string ('SIM-01'...)</span></li>
                <li className="flex justify-between"><span>theme_cluster</span> <span>string</span></li>
                <li className="flex justify-between"><span>compatible_tracks</span> <span>string[]</span></li>
                <li className="flex justify-between"><span>similarity_tags</span> <span>string[]</span></li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
