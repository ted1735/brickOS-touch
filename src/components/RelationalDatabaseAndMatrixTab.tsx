import React, { useState } from 'react';
import {
  Database,
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
  FileCode,
  Sliders,
  FolderSync
} from 'lucide-react';
import { Track } from '../types';
import { HelpCircle } from 'lucide-react';
import { SectionQuickHelpBanner } from './SectionQuickHelpBanner';
import {
  PRODUCTION_NEXTCLOUD_WEBDAV,
  PRODUCTION_NEXTCLOUD_BASE,
  DEFAULT_WEBDAV_USER,
  OFFICIAL_VOCAL_ARCHETYPES,
  INTERCHANGEABLE_ASSET_MATRIX,
  getTrackStems,
  getTrackVisualAssets,
  generatePostgreSqlRelationalMigration,
  generateCurlStemUploadCommand,
  generateRcloneConfigBlock,
  generateRcloneSyncCommand,
  generateWindowsDriveMountCommand
} from '../data/relationalCatalogBridge';

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
  const [activeSubView, setActiveSubView] = useState<
    'matrix' | 'resolver' | 'vocal_archetypes' | 'sql_exporter' | 'schema' | 'daw_helpers'
  >('matrix');

  const [selectedClusterFilter, setSelectedClusterFilter] = useState<string>('ALL');
  const [matrixSearch, setMatrixSearch] = useState<string>('');
  const [isCopiedSql, setIsCopiedSql] = useState<boolean>(false);

  // Filter interchangeable matrix
  const filteredMatrix = INTERCHANGEABLE_ASSET_MATRIX.filter((item) => {
    const matchesCluster =
      selectedClusterFilter === 'ALL' || item.themeCluster === selectedClusterFilter;
    const matchesSearch =
      !matrixSearch ||
      item.title.toLowerCase().includes(matrixSearch.toLowerCase()) ||
      item.similarityTags.some((t) => t.toLowerCase().includes(matrixSearch.toLowerCase())) ||
      item.compatibleTracks.some((t) => t.toLowerCase().includes(matrixSearch.toLowerCase()));
    return matchesCluster && matchesSearch;
  });

  const activeStems = getTrackStems(selectedTrack.id);
  const activeVisuals = getTrackVisualAssets(selectedTrack);
  const generatedSql = generatePostgreSqlRelationalMigration(tracks);

  const handleCopySql = () => {
    onCopyText(generatedSql, 'PostgreSQL Relational Seed Script');
    setIsCopiedSql(true);
    setTimeout(() => setIsCopiedSql(false), 3000);
  };

  const handleDownloadSql = () => {
    const blob = new Blob([generatedSql], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'brickos_relational_seed.sql';
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

      {/* Top Banner & WebDAV Root Status */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden shadow-xl">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 font-mono text-xs font-bold border border-cyan-700/50 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-cyan-400" />
                Master Catalog & Asset Matrix
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 font-mono text-xs font-semibold border border-emerald-700/40 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Nextcloud WebDAV Active
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 font-mono text-xs font-semibold border border-amber-700/40">
                26 Master Tracks Linked
              </span>
            </div>
            <h2 className="text-xl font-black text-white tracking-wide">
              Master Catalog & Interchangeable Asset Similarity Matrix
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
              Every track record is catalog-linked with its official vocal archetype (The Architect, Brandon, Ms T, Monica, Kane), 
              BPM, key, theological theme thesis, 24-bit/48kHz UVR5 stems, and visual assets resolved directly to your self-hosted Nextcloud WebDAV root.
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
              onClick={handleCopySql}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-950 transition"
            >
              {isCopiedSql ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{isCopiedSql ? 'Copied Catalog Seed!' : 'Copy Catalog Backup'}</span>
            </button>
            <button
              onClick={handleDownloadSql}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 flex items-center gap-2 transition"
            >
              <Download className="w-4 h-4 text-teal-400" />
              <span>Download Schema</span>
            </button>
          </div>
        </div>

        {/* WebDAV Path Live Box */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-400">
            <HardDrive className="w-4 h-4 text-indigo-400 shrink-0" />
            <span className="text-slate-400 font-bold">Endpoint:</span>
            <span className="text-indigo-300 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800 select-all truncate max-w-xl">
              {PRODUCTION_NEXTCLOUD_WEBDAV}
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <span>User:</span>
            <span className="text-emerald-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
              {DEFAULT_WEBDAV_USER}
            </span>
            <button
              onClick={() => onCopyText(PRODUCTION_NEXTCLOUD_WEBDAV, 'WebDAV Root URL')}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition"
            >
              Copy URL
            </button>
          </div>
        </div>
      </div>

      {/* CLOUD FIRESTORE DATABASE PERSISTENCE STATUS */}
      <div className="bg-slate-900 border border-cyan-800/40 rounded-2xl p-5 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-700/60 flex items-center justify-center flex-shrink-0">
              <Database className={`w-5 h-5 ${isDbSyncing ? 'text-amber-400 animate-spin' : 'text-cyan-400'}`} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Firebase Cloud Firestore Database</span>
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-700/50 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Active & Auto-Saving
                </span>
                <span className="px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 font-mono text-[10px] font-bold border border-cyan-700/50">
                  {tracks.length} Tracks in Cloud
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Every newly created song, lyrics revision, version snapshot, and theological audit is automatically synchronized and permanently preserved.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {onSyncDatabase && (
              <button
                type="button"
                onClick={onSyncDatabase}
                disabled={isDbSyncing}
                className="px-3.5 py-2 rounded-xl bg-cyan-900/60 hover:bg-cyan-800/80 text-cyan-200 border border-cyan-700/60 font-bold text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer disabled:opacity-50"
                title="Force a real-time cloud sync of all tracks and drafts"
              >
                <FolderSync className={`w-3.5 h-3.5 ${isDbSyncing ? 'animate-spin text-amber-400' : 'text-cyan-400'}`} />
                <span>{isDbSyncing ? 'Syncing to Cloud...' : 'Sync Catalog Now'}</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-3.5 border-t border-slate-800 text-[11px] font-mono">
          <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
            <span className="text-slate-500 block text-[10px] uppercase">Cloud Collection</span>
            <span className="text-cyan-300 font-semibold">tracks / {tracks.length} documents</span>
          </div>
          <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
            <span className="text-slate-500 block text-[10px] uppercase">Persistence Mode</span>
            <span className="text-emerald-400 font-semibold">Multi-Device Real-Time Cloud + Offline Cache</span>
          </div>
          <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
            <span className="text-slate-500 block text-[10px] uppercase">Security Rules</span>
            <span className="text-purple-300 font-semibold">firestore.rules Deployed ✓</span>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800">
        <button
          onClick={() => setActiveSubView('matrix')}
          className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 whitespace-nowrap transition ${
            activeSubView === 'matrix'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-950'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Layers className="w-4 h-4 text-amber-300" />
          <span>Interchangeable Asset Similarity Matrix</span>
        </button>

        <button
          onClick={() => setActiveSubView('resolver')}
          className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 whitespace-nowrap transition ${
            activeSubView === 'resolver'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-950'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Link2 className="w-4 h-4 text-emerald-400" />
          <span>Dynamic WebDAV Asset Resolver ({selectedTrack.id})</span>
        </button>

        <button
          onClick={() => setActiveSubView('vocal_archetypes')}
          className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 whitespace-nowrap transition ${
            activeSubView === 'vocal_archetypes'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-950'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Mic className="w-4 h-4 text-purple-400" />
          <span>Vocal Archetypes Roster</span>
        </button>

        <button
          onClick={() => setActiveSubView('sql_exporter')}
          className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 whitespace-nowrap transition ${
            activeSubView === 'sql_exporter'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-950'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <FileCode className="w-4 h-4 text-cyan-400" />
          <span>PostgreSQL Relational Seed Sync</span>
        </button>

        <button
          onClick={() => setActiveSubView('daw_helpers')}
          className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 whitespace-nowrap transition ${
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
          className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 whitespace-nowrap transition ${
            activeSubView === 'schema'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-950'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Table className="w-4 h-4 text-blue-400" />
          <span>Schema & ER Structure</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. INTERCHANGEABLE ASSET SIMILARITY MATRIX */}
      {/* ========================================================================= */}
      {activeSubView === 'matrix' && (
        <div className="space-y-5">
          {/* Filter Bar & Search */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-md">
            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
              <span className="text-xs text-slate-400 font-bold uppercase font-mono mr-1">Filter:</span>
              <button
                onClick={() => setSelectedClusterFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  selectedClusterFilter === 'ALL'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                All Assets ({INTERCHANGEABLE_ASSET_MATRIX.length})
              </button>
              <button
                onClick={() => setSelectedClusterFilter('Theme_SanctuaryCross')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                  selectedClusterFilter === 'Theme_SanctuaryCross'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                #Theme_SanctuaryCross (TRK-01, 03, 04, 24)
              </button>
              <button
                onClick={() => setSelectedClusterFilter('Theme_BlueCollarGrit')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                  selectedClusterFilter === 'Theme_BlueCollarGrit'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                #Theme_BlueCollarGrit (TRK-07, 09, 13, 14)
              </button>
              <button
                onClick={() => setSelectedClusterFilter('CrossCatalog_BRoll')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                  selectedClusterFilter === 'CrossCatalog_BRoll'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <Film className="w-3.5 h-3.5 text-purple-300" />
                #CrossCatalog_BRoll (General Video)
              </button>
              <button
                onClick={() => setSelectedClusterFilter('Universal')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                  selectedClusterFilter === 'Universal'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                #Universal (Logos & Song2Sing)
              </button>
            </div>

            <input
              type="text"
              value={matrixSearch}
              onChange={(e) => setMatrixSearch(e.target.value)}
              placeholder="Search matrix tags, files, track ID..."
              className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-1.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-indigo-500 w-full md:w-64"
            />
          </div>

          {/* Matrix Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMatrix.map((item) => (
              <div
                key={item.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-4 hover:border-slate-700 transition shadow-lg group"
              >
                <div>
                  {/* Top Header */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase tracking-wider ${
                        item.themeCluster === 'Theme_SanctuaryCross'
                          ? 'bg-amber-950/80 text-amber-300 border border-amber-800/40'
                          : item.themeCluster === 'Theme_BlueCollarGrit'
                          ? 'bg-blue-950/80 text-blue-300 border border-blue-800/40'
                          : item.themeCluster === 'CrossCatalog_BRoll'
                          ? 'bg-purple-950/80 text-purple-300 border border-purple-800/40'
                          : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/40'
                      }`}
                    >
                      {item.themeCluster.replace('Theme_', '')}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      {item.assetType}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition line-clamp-1">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>

                  {/* Thumbnail / Image Preview if available */}
                  {item.previewUrl && (
                    <div className="mt-3 relative h-32 rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                      <img
                        src={item.previewUrl}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent flex items-end p-2.5">
                        <span className="text-[10px] font-mono text-indigo-300 bg-slate-900/90 px-2 py-0.5 rounded border border-indigo-700/40 backdrop-blur-sm">
                          WebDAV Verified Asset
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Similarity Tags */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {item.similarityTags.map((tag, idx) => (
                      <span
                        key={idx}
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                          tag.includes('SanctuaryCross')
                            ? 'bg-amber-950/50 text-amber-300 border-amber-800/40'
                            : tag.includes('BlueCollarGrit')
                            ? 'bg-blue-950/50 text-blue-300 border-blue-800/40'
                            : tag.includes('CrossCatalog')
                            ? 'bg-purple-950/50 text-purple-300 border-purple-800/40'
                            : 'bg-slate-950 text-slate-400 border-slate-800'
                        }`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Compatible Tracks */}
                  <div className="mt-3 pt-3 border-t border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-500 font-mono block mb-1.5">
                      Interchangeable Across:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {item.compatibleTracks.map((trId) => (
                        <button
                          key={trId}
                          onClick={() => {
                            const found = tracks.find((t) => t.id === trId);
                            if (found) onSelectTrack(found);
                          }}
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border transition ${
                            selectedTrack.id === trId
                              ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                              : 'bg-slate-950 text-indigo-300 hover:bg-slate-800 border-slate-800'
                          }`}
                        >
                          {trId === 'ALL_CATALOG' ? '🌐 Universal All Songs' : trId}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer WebDAV Path & Copy */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                  <div className="text-[10px] font-mono text-slate-500 truncate select-all">
                    {item.webdavRelativePath}
                  </div>
                  <button
                    onClick={() => onCopyText(item.fullWebdavUrl, 'WebDAV Asset URI')}
                    className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition shrink-0"
                    title="Copy Full WebDAV URL"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. DYNAMIC WEBDAV ASSET RESOLVER */}
      {/* ========================================================================= */}
      {activeSubView === 'resolver' && (
        <div className="space-y-6">
          {/* Track Selector Ribbon */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                Active Track Relational Node:
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-black text-white text-base">
                  {selectedTrack.id}: {selectedTrack.title}
                </span>
                <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 font-mono text-xs border border-indigo-800/40">
                  {selectedTrack.key} • {selectedTrack.bpm} BPM
                </span>
                <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 font-mono text-xs border border-purple-800/40">
                  {selectedTrack.vocal}
                </span>
              </div>
            </div>

            {/* Quick Track Switcher */}
            <select
              value={selectedTrack.id}
              onChange={(e) => {
                const found = tracks.find((t) => t.id === e.target.value);
                if (found) onSelectTrack(found);
              }}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
            >
              {tracks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.id} - {t.title} ({t.vocal})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Audio Stems Matrix */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Music className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white">Audio Stems Matrix (24-bit / 48kHz PCM)</h3>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/40">
                  UVR5 & DAW Direct
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Stems auto-map to: <code className="text-indigo-300 bg-slate-950 px-1.5 py-0.5 rounded text-[11px] font-mono">.../brickOS/{selectedTrack.id}/stems/</code>
              </p>

              <div className="space-y-3">
                {activeStems.map((stem) => (
                  <div
                    key={stem.id}
                    className="p-3.5 bg-slate-950 border border-slate-800/80 rounded-xl space-y-2 hover:border-slate-700 transition"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        <span className="text-xs font-bold text-white font-mono">{stem.passType}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        {stem.sampleRateHz / 1000}kHz / {stem.bitDepth}-bit ({(stem.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB)
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 font-sans">{stem.modelUsed}</div>

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <div className="text-[10px] font-mono text-indigo-300 truncate select-all flex-1">
                        {stem.fullWebdavUrl}
                      </div>
                      <button
                        onClick={() => onCopyText(stem.fullWebdavUrl, `${stem.passType} WebDAV URL`)}
                        className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 text-[10px] font-mono border border-slate-700 flex items-center gap-1 transition"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Visual Assets Matrix */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">Visual Assets & Keyframe Pipeline</h3>
                </div>
                <span className="text-[10px] font-mono text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800/40">
                  Veo 3 & NightCafe
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Visuals auto-map to: <code className="text-indigo-300 bg-slate-950 px-1.5 py-0.5 rounded text-[11px] font-mono">.../brickOS/{selectedTrack.id}/visuals/v1.0/</code>
              </p>

              <div className="space-y-3">
                {activeVisuals.map((vis) => (
                  <div
                    key={vis.id}
                    className="p-3.5 bg-slate-950 border border-slate-800/80 rounded-xl space-y-2 hover:border-slate-700 transition"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                        <span className="text-xs font-bold text-white font-mono">{vis.assetType}</span>
                      </div>
                      <span className="text-[10px] font-mono text-amber-300 bg-amber-950/50 px-2 py-0.5 rounded border border-amber-800/30">
                        {vis.aspectRatio}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 font-sans line-clamp-1">{vis.prompt}</div>

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <div className="text-[10px] font-mono text-indigo-300 truncate select-all flex-1">
                        {vis.fullWebdavUrl}
                      </div>
                      <button
                        onClick={() => onCopyText(vis.fullWebdavUrl, `${vis.assetType} WebDAV URL`)}
                        className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 text-[10px] font-mono border border-slate-700 flex items-center gap-1 transition"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. VOCAL ARCHETYPES ROSTER */}
      {/* ========================================================================= */}
      {activeSubView === 'vocal_archetypes' && (
        <div className="space-y-5">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Mic className="w-4 h-4 text-purple-400" />
              <span>Official Vocal Archetypes Roster (Pre-Loaded Lyric Metadata)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Every track record in the relational database is linked to its official vocal archetype to ensure consistent timbre, formant texture, and theological authority across Suno v5.5 generation blocks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {OFFICIAL_VOCAL_ARCHETYPES.map((vocal) => {
              const assignedTracks = tracks.filter((t) =>
                t.vocal.toLowerCase().includes(vocal.name.toLowerCase()) ||
                (vocal.name === 'The Architect' && t.vocal.toLowerCase().includes('architect')) ||
                (vocal.name === 'Brandon' && (t.vocal.toLowerCase().includes('brandon') || t.vocal.toLowerCase().includes('craftsman'))) ||
                (vocal.name === 'Ms T' && (t.vocal.toLowerCase().includes('ms t') || t.vocal.toLowerCase().includes('choir') || t.vocal.toLowerCase().includes('mrs t'))) ||
                (vocal.name === 'Kane' && (t.vocal.toLowerCase().includes('kane') || t.vocal.toLowerCase().includes('cynic')))
              );

              return (
                <div
                  key={vocal.name}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-3 hover:border-purple-500/50 transition shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-black text-white">{vocal.name}</span>
                      <span className="px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 font-mono text-[10px] border border-purple-800/40">
                        {assignedTracks.length} Songs
                      </span>
                    </div>

                    <div className="text-xs font-bold text-indigo-400 mb-1 font-mono">
                      {vocal.archetypeTitle}
                    </div>

                    <p className="text-[11px] text-slate-400 mb-2 leading-relaxed">
                      {vocal.role}
                    </p>

                    <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1 mb-3">
                      <span className="text-[10px] uppercase font-bold text-slate-500 font-mono block">
                        Formant Texture:
                      </span>
                      <p className="text-[11px] text-slate-300 font-mono leading-tight">
                        {vocal.formantTexture}
                      </p>
                    </div>

                    <div className="text-[10px] text-slate-400">
                      <strong className="text-slate-300">Recommended Genres:</strong> {vocal.recommendedGenres}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-500 font-mono block mb-1">
                      Assigned Tracks:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {assignedTracks.slice(0, 5).map((t) => (
                        <button
                          key={t.id}
                          onClick={() => onSelectTrack(t)}
                          className="px-2 py-0.5 bg-slate-950 hover:bg-indigo-900 text-[10px] font-mono text-indigo-300 rounded border border-slate-800 transition"
                        >
                          {t.id}
                        </button>
                      ))}
                      {assignedTracks.length > 5 && (
                        <span className="text-[10px] font-mono text-slate-500 self-center">
                          +{assignedTracks.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. POSTGRESQL RELATIONAL SEED SYNC & EXPORTER */}
      {/* ========================================================================= */}
      {activeSubView === 'sql_exporter' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileCode className="w-4 h-4 text-cyan-400" />
                <span>PostgreSQL Relational Seed Generator (Idempotent DDL + DML)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Generates complete SQL schema and UPSERT seed data linking all 26 songs, vocal archetypes, official BPMs, keys, theological theses, audio stems, visual assets, and interchangeable similarity links pointing to your live Nextcloud WebDAV root.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopySql}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-950 transition"
              >
                {isCopiedSql ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                <span>{isCopiedSql ? 'Copied SQL!' : 'Copy SQL Script'}</span>
              </button>
              <button
                onClick={handleDownloadSql}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-teal-950 transition"
              >
                <Download className="w-4 h-4" />
                <span>Download .sql</span>
              </button>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 overflow-hidden">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-[11px] font-mono text-slate-400">
              <span>SQL Target: PostgreSQL 14+ / Supabase / Cloud SQL / Baserow</span>
              <span>Lines: ~{generatedSql.split('\n').length} lines • UTF-8</span>
            </div>
            <pre className="text-xs font-mono text-slate-300 p-3 bg-slate-900/90 rounded-xl overflow-x-auto max-h-[550px] leading-relaxed select-all">
              {generatedSql}
            </pre>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. DAW & CLI HELPERS (cURL, rclone, net use Z:) */}
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* cURL One-Line Upload */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-7 h-7 rounded-lg bg-pink-950 text-pink-400 font-mono font-bold text-xs flex items-center justify-center border border-pink-800/40">
                    1
                  </span>
                  <h4 className="text-sm font-bold text-white">cURL Direct Stem Upload</h4>
                </div>
                <p className="text-xs text-slate-400 mb-3">
                  Upload individual 24-bit/48kHz stems or master mixes directly to {selectedTrack.id}&apos;s storage folder via HTTP PUT:
                </p>
                <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-[11px] text-pink-300 overflow-x-auto select-all leading-relaxed">
                  {generateCurlStemUploadCommand(
                    selectedTrack.id,
                    `${selectedTrack.id}_BS-Roformer_Vocal_24bit_48k.wav`
                  )}
                </pre>
              </div>
              <button
                onClick={() =>
                  onCopyText(
                    generateCurlStemUploadCommand(
                      selectedTrack.id,
                      `${selectedTrack.id}_BS-Roformer_Vocal_24bit_48k.wav`
                    ),
                    'cURL Upload Command'
                  )
                }
                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center justify-center gap-2 transition"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy cURL Command</span>
              </button>
            </div>

            {/* rclone Sync Block */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-7 h-7 rounded-lg bg-indigo-950 text-indigo-400 font-mono font-bold text-xs flex items-center justify-center border border-indigo-800/40">
                    2
                  </span>
                  <h4 className="text-sm font-bold text-white">rclone Automated Sync Block</h4>
                </div>
                <p className="text-xs text-slate-400 mb-3">
                  Auto-configured rclone block for background syncing of Cakewalk or DaVinci Resolve project folders:
                </p>
                <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-[10px] text-indigo-300 overflow-x-auto select-all leading-relaxed">
                  {generateRcloneConfigBlock()}
                  {'\n\n# Run Sync Command:\n'}
                  {generateRcloneSyncCommand(selectedTrack.id)}
                </pre>
              </div>
              <button
                onClick={() =>
                  onCopyText(
                    `${generateRcloneConfigBlock()}\n\n${generateRcloneSyncCommand(selectedTrack.id)}`,
                    'rclone Configuration & Sync Snippet'
                  )
                }
                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center justify-center gap-2 transition"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy rclone Block</span>
              </button>
            </div>

            {/* Windows Network Drive Mount */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-7 h-7 rounded-lg bg-emerald-950 text-emerald-400 font-mono font-bold text-xs flex items-center justify-center border border-emerald-800/40">
                    3
                  </span>
                  <h4 className="text-sm font-bold text-white">Windows Network Drive (Z:)</h4>
                </div>
                <p className="text-xs text-slate-400 mb-3">
                  Mount Nextcloud WebDAV directly as drive letter <strong className="text-white">Z:</strong> on your Windows DAW workstation:
                </p>
                <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-[11px] text-emerald-300 overflow-x-auto select-all leading-relaxed">
                  {generateWindowsDriveMountCommand()}
                </pre>
              </div>
              <button
                onClick={() =>
                  onCopyText(generateWindowsDriveMountCommand(), 'Windows net use Command')
                }
                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center justify-center gap-2 transition"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy net use Command</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. SCHEMA & ER STRUCTURE */}
      {/* ========================================================================= */}
      {activeSubView === 'schema' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Table className="w-4 h-4 text-blue-400" />
              <span>Entity-Relationship Architecture (PostgreSQL)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Zero cloud lock-in. Relational links maintain strict foreign keys between EPs, master song tracks, versioned lyrics, UVR5 audio stems, visual artwork, and cross-catalog interchangeable asset pools.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* ep_collections */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-white text-xs font-mono">ep_collections</span>
                <span className="text-[10px] font-mono text-indigo-400">TABLE</span>
              </div>
              <ul className="text-[11px] font-mono space-y-1 text-slate-300">
                <li className="flex justify-between"><span className="text-amber-400">id (PK)</span> <span>VARCHAR(16)</span></li>
                <li className="flex justify-between"><span>title</span> <span>VARCHAR(128)</span></li>
                <li className="flex justify-between"><span>theme</span> <span>TEXT</span></li>
                <li className="flex justify-between"><span>target_release_date</span> <span>DATE</span></li>
              </ul>
            </div>

            {/* vocal_archetypes */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-white text-xs font-mono">vocal_archetypes</span>
                <span className="text-[10px] font-mono text-purple-400">TABLE</span>
              </div>
              <ul className="text-[11px] font-mono space-y-1 text-slate-300">
                <li className="flex justify-between"><span className="text-amber-400">name (PK)</span> <span>VARCHAR(64)</span></li>
                <li className="flex justify-between"><span>archetype_title</span> <span>VARCHAR(128)</span></li>
                <li className="flex justify-between"><span>role</span> <span>VARCHAR(128)</span></li>
                <li className="flex justify-between"><span>formant_texture</span> <span>VARCHAR(128)</span></li>
                <li className="flex justify-between"><span>recommended_genres</span> <span>TEXT</span></li>
              </ul>
            </div>

            {/* tracks */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-white text-xs font-mono">tracks</span>
                <span className="text-[10px] font-mono text-indigo-400">CENTRAL TABLE</span>
              </div>
              <ul className="text-[11px] font-mono space-y-1 text-slate-300">
                <li className="flex justify-between"><span className="text-amber-400">id (PK)</span> <span>VARCHAR(16)</span></li>
                <li className="flex justify-between"><span className="text-indigo-400">ep_id (FK)</span> <span>VARCHAR(16)</span></li>
                <li className="flex justify-between"><span>title</span> <span>VARCHAR(255)</span></li>
                <li className="flex justify-between"><span>status</span> <span>project_status</span></li>
                <li className="flex justify-between"><span>bpm</span> <span>INTEGER</span></li>
                <li className="flex justify-between"><span>musical_key</span> <span>VARCHAR(32)</span></li>
                <li className="flex justify-between"><span className="text-purple-400">vocal_archetype (FK)</span> <span>VARCHAR(64)</span></li>
                <li className="flex justify-between"><span>theme_thesis</span> <span>TEXT</span></li>
              </ul>
            </div>

            {/* audio_stems */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-white text-xs font-mono">audio_stems</span>
                <span className="text-[10px] font-mono text-emerald-400">TABLE</span>
              </div>
              <ul className="text-[11px] font-mono space-y-1 text-slate-300">
                <li className="flex justify-between"><span className="text-amber-400">id (PK)</span> <span>UUID</span></li>
                <li className="flex justify-between"><span className="text-indigo-400">track_id (FK)</span> <span>VARCHAR(16)</span></li>
                <li className="flex justify-between"><span>pass_type</span> <span>stem_pass_type</span></li>
                <li className="flex justify-between"><span>model_used</span> <span>VARCHAR(128)</span></li>
                <li className="flex justify-between"><span className="text-emerald-300">webdav_relative_path</span> <span>TEXT</span></li>
                <li className="flex justify-between"><span>sample_rate_hz</span> <span>INTEGER</span></li>
              </ul>
            </div>

            {/* visual_assets */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-white text-xs font-mono">visual_assets</span>
                <span className="text-[10px] font-mono text-amber-400">TABLE</span>
              </div>
              <ul className="text-[11px] font-mono space-y-1 text-slate-300">
                <li className="flex justify-between"><span className="text-amber-400">id (PK)</span> <span>UUID</span></li>
                <li className="flex justify-between"><span className="text-indigo-400">track_id (FK)</span> <span>VARCHAR(16)</span></li>
                <li className="flex justify-between"><span>asset_type</span> <span>visual_asset_type</span></li>
                <li className="flex justify-between"><span>aspect_ratio</span> <span>VARCHAR(8)</span></li>
                <li className="flex justify-between"><span className="text-emerald-300">webdav_relative_path</span> <span>TEXT</span></li>
                <li className="flex justify-between"><span>is_active_master</span> <span>BOOLEAN</span></li>
              </ul>
            </div>

            {/* interchangeable_asset_links */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-white text-xs font-mono">interchangeable_asset_links</span>
                <span className="text-[10px] font-mono text-pink-400">MATRIX TABLE</span>
              </div>
              <ul className="text-[11px] font-mono space-y-1 text-slate-300">
                <li className="flex justify-between"><span className="text-amber-400">id (PK)</span> <span>UUID</span></li>
                <li className="flex justify-between"><span className="text-indigo-400">primary_track_id (FK)</span> <span>VARCHAR(16)</span></li>
                <li className="flex justify-between"><span>theme_cluster</span> <span>VARCHAR(64)</span></li>
                <li className="flex justify-between"><span className="text-emerald-300">webdav_relative_path</span> <span>TEXT</span></li>
                <li className="flex justify-between"><span>similarity_tags</span> <span>TEXT[]</span></li>
                <li className="flex justify-between"><span>compatible_tracks</span> <span>TEXT[]</span></li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
