import React, { useState } from 'react';
import {
  Layers,
  CheckCircle,
  Clock,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Search,
  Filter,
  Plus,
  Heart,
  FileText,
  Activity,
  Zap,
  TrendingUp,
  Music,
  Disc,
  Sliders,
  Check,
  LayoutGrid,
  Columns,
  Play,
  Scissors,
  ExternalLink,
  HelpCircle
} from 'lucide-react';
import { Track, TrackStatus, EPCollection } from '../types';

interface KanbanDashboardTabProps {
  tracks: Track[];
  onSelectTrack: (track: Track) => void;
  onUpdateTrackStatus: (trackId: string, newStatus: TrackStatus) => void;
  onAddNewTrack: (newTrack: Track) => void;
  onNavigateToTab: (tab: any) => void;
  epCollections: EPCollection[];
  selectedEpFilter?: string;
  onSelectEpFilter?: (ep: string) => void;
  onOpenCreateProject?: () => void;
  onOpenSectionGuide?: (sectionId?: any) => void;
  isDarkMode?: boolean;
}

const STATUS_COLUMNS: { id: TrackStatus; title: string; color: string; bgBadgeDark: string; bgBadgeLight: string; borderDark: string; borderLight: string }[] = [
  { id: 'Idea / Concept', title: '1. Idea / Concept', color: 'text-amber-500', bgBadgeDark: 'bg-amber-950/60 text-amber-300 border-amber-800/50', bgBadgeLight: 'bg-amber-100 text-amber-800 border-amber-300', borderDark: 'border-amber-700/50', borderLight: 'border-amber-200' },
  { id: 'Lyrics Finalized', title: '2. Lyrics Finalized', color: 'text-blue-500', bgBadgeDark: 'bg-blue-950/60 text-blue-300 border-blue-800/50', bgBadgeLight: 'bg-blue-100 text-blue-800 border-blue-300', borderDark: 'border-blue-700/50', borderLight: 'border-blue-200' },
  { id: 'In Progress', title: '3. In Progress', color: 'text-indigo-500', bgBadgeDark: 'bg-indigo-950/60 text-indigo-300 border-indigo-800/50', bgBadgeLight: 'bg-indigo-100 text-indigo-800 border-indigo-300', borderDark: 'border-indigo-700/50', borderLight: 'border-indigo-200' },
  { id: 'UVR5 Stem Prep', title: '4. UVR5 Stem Prep', color: 'text-purple-500', bgBadgeDark: 'bg-purple-950/60 text-purple-300 border-purple-800/50', bgBadgeLight: 'bg-purple-100 text-purple-800 border-purple-300', borderDark: 'border-purple-700/50', borderLight: 'border-purple-200' },
  { id: 'Audio Master', title: '5. Audio Master', color: 'text-cyan-500', bgBadgeDark: 'bg-cyan-950/60 text-cyan-300 border-cyan-800/50', bgBadgeLight: 'bg-cyan-100 text-cyan-800 border-cyan-300', borderDark: 'border-cyan-700/50', borderLight: 'border-cyan-200' },
  { id: 'Sent for Distribution', title: '6. Distribution Ready', color: 'text-emerald-500', bgBadgeDark: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/50', bgBadgeLight: 'bg-emerald-100 text-emerald-800 border-emerald-300', borderDark: 'border-emerald-700/50', borderLight: 'border-emerald-200' },
  { id: 'Released', title: '7. Released', color: 'text-rose-500', bgBadgeDark: 'bg-rose-950/60 text-rose-300 border-rose-800/50', bgBadgeLight: 'bg-rose-100 text-rose-800 border-rose-300', borderDark: 'border-rose-700/50', borderLight: 'border-rose-200' },
];

export const KanbanDashboardTab: React.FC<KanbanDashboardTabProps> = ({
  tracks,
  onSelectTrack,
  onUpdateTrackStatus,
  onAddNewTrack,
  onNavigateToTab,
  epCollections,
  selectedEpFilter = 'ALL',
  onSelectEpFilter,
  onOpenCreateProject,
  onOpenSectionGuide,
  isDarkMode = true
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [localEpFilter, setLocalEpFilter] = useState<string>(selectedEpFilter);
  const [layoutMode, setLayoutMode] = useState<'kanban' | 'bento'>('kanban');

  const activeEp = onSelectEpFilter ? selectedEpFilter : localEpFilter;
  const setActiveEp = (ep: string) => {
    setLocalEpFilter(ep);
    if (onSelectEpFilter) {
      onSelectEpFilter(ep);
    }
  };

  // Compute live metrics from the canonical track database
  const totalTracks = tracks.length;
  const releasedTracks = tracks.filter(t => t.status === 'Released');
  const distributionTracks = tracks.filter(t => t.status === 'Sent for Distribution');
  const audioMasterTracks = tracks.filter(t => t.status === 'Audio Master');
  const inProgressTracks = tracks.filter(t => t.status === 'In Progress');
  const stemPrepTracks = tracks.filter(t => t.status === 'UVR5 Stem Prep');
  const lyricsFinalizedTracks = tracks.filter(t => t.status === 'Lyrics Finalized');
  const ideaTracks = tracks.filter(t => t.status === 'Idea / Concept');
  const selahPrayedTracks = tracks.filter(t => t.selahPrayed);

  const selahCompliancePercent = totalTracks > 0 ? Math.round((selahPrayedTracks.length / totalTracks) * 100) : 0;
  const readyPercent = totalTracks > 0 ? Math.round(((releasedTracks.length + distributionTracks.length + audioMasterTracks.length) / totalTracks) * 100) : 0;
  const averageBpm = totalTracks > 0 ? Math.round(tracks.reduce((acc, t) => acc + (t.bpm || 0), 0) / totalTracks) : 0;

  // Filtered tracks for the Kanban board / Bento grid
  const filteredTracks = tracks.filter(t => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.genre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.vocalCast.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.thesis.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesEp = activeEp === 'ALL' || t.ep.toLowerCase().includes(activeEp.toLowerCase());
    return matchesSearch && matchesEp;
  });

  // Advance or revert track status
  const handleMoveStatus = (track: Track, direction: 'prev' | 'next') => {
    const currentIndex = STATUS_COLUMNS.findIndex(c => c.id === track.status);
    if (currentIndex === -1) return;
    const targetIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (targetIndex >= 0 && targetIndex < STATUS_COLUMNS.length) {
      onUpdateTrackStatus(track.id, STATUS_COLUMNS[targetIndex].id);
    }
  };

  return (
    <div className={`h-full flex flex-col overflow-hidden transition-colors duration-200 ${isDarkMode ? 'text-slate-200' : 'text-slate-900'}`}>
      
      {/* =========================================================================
          DOUBLE-STACKED MODULES AT THE TOP (Program-Grade Fixed Header & Telemetry)
          ========================================================================= */}
      <div className={`flex-shrink-0 border rounded-2xl p-2.5 sm:p-3 space-y-2 mb-2 transition-all ${
        isDarkMode
          ? 'bg-slate-900 border-slate-800 shadow-lg'
          : 'bg-white border-slate-200 shadow-xs'
      }`}>
        
        {/* TOP STACK ROW 1: View Identity, Layout Mode, EP Filter Pills, Search & Actions */}
        <div className="flex items-center justify-between gap-2.5 flex-wrap">
          
          {/* Left: View Identity & Layout Switcher */}
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs border ${
              isDarkMode
                ? 'bg-indigo-600/20 text-indigo-400 border-indigo-500/30'
                : 'bg-indigo-50 text-indigo-700 border-indigo-200'
            }`}>
              <Layers className="w-4 h-4" />
            </div>
            
            <div className="flex items-center gap-1.5">
              <h2 className={`text-xs font-black tracking-wider uppercase ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Release Pipeline
              </h2>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${
                isDarkMode
                  ? 'bg-indigo-950 text-indigo-300 border-indigo-800/50'
                  : 'bg-indigo-50 text-indigo-700 border-indigo-200'
              }`}>
                {tracks.length} Master Tracks
              </span>
            </div>

            {/* Layout Mode Toggle: Kanban vs Bento Grid */}
            <div className={`flex items-center p-0.5 rounded-xl border text-[11px] font-bold ml-1 ${
              isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
            }`}>
              <button
                type="button"
                onClick={() => setLayoutMode('kanban')}
                className={`px-2 py-0.5 rounded-lg flex items-center gap-1 transition cursor-pointer ${
                  layoutMode === 'kanban'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : isDarkMode
                    ? 'text-slate-400 hover:text-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="7-Column Pipeline Kanban View"
              >
                <Columns className="w-3 h-3" />
                <span className="hidden sm:inline">Kanban</span>
              </button>
              <button
                type="button"
                onClick={() => setLayoutMode('bento')}
                className={`px-2 py-0.5 rounded-lg flex items-center gap-1 transition cursor-pointer ${
                  layoutMode === 'bento'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : isDarkMode
                    ? 'text-slate-400 hover:text-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Modular Bento Grid Matrix View"
              >
                <LayoutGrid className="w-3 h-3" />
                <span className="hidden sm:inline">Bento Grid</span>
              </button>
            </div>
          </div>

          {/* Center: EP Selector Filter Buttons (Double-Stacked Nav Pills) */}
          <div className={`flex items-center gap-1 p-1 rounded-xl border overflow-x-auto custom-scrollbar ${
            isDarkMode ? 'bg-slate-950 border-slate-800/80' : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              onClick={() => setActiveEp('ALL')}
              className={`px-2 py-1 rounded-lg text-[11px] font-bold transition whitespace-nowrap cursor-pointer ${
                activeEp === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : isDarkMode
                  ? 'text-slate-400 hover:text-white hover:bg-slate-900'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              All EPs ({tracks.length})
            </button>
            <button
              onClick={() => setActiveEp('EP 1')}
              className={`px-2 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 whitespace-nowrap cursor-pointer ${
                activeEp.includes('EP 1')
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : isDarkMode
                  ? 'text-slate-400 hover:text-white hover:bg-slate-900'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
              title="EP 1: The Restoration Project (Refinement & Healing)"
            >
              <span>EP 1: Restoration</span>
              <span className="font-mono text-[9px] opacity-75">
                ({tracks.filter(t => t.ep.includes('EP 1')).length})
              </span>
            </button>
            <button
              onClick={() => setActiveEp('EP 2')}
              className={`px-2 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 whitespace-nowrap cursor-pointer ${
                activeEp.includes('EP 2')
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : isDarkMode
                  ? 'text-slate-400 hover:text-white hover:bg-slate-900'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
              title="EP 2: The Conflict Suite (Family & Relationships)"
            >
              <span>EP 2: Conflict</span>
              <span className="font-mono text-[9px] opacity-75">
                ({tracks.filter(t => t.ep.includes('EP 2')).length})
              </span>
            </button>
            <button
              onClick={() => setActiveEp('EP 3')}
              className={`px-2 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 whitespace-nowrap cursor-pointer ${
                activeEp.includes('EP 3')
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : isDarkMode
                  ? 'text-slate-400 hover:text-white hover:bg-slate-900'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
              title="EP 3: War Room Anthems (Spiritual Warfare)"
            >
              <span>EP 3: War Room</span>
              <span className="font-mono text-[9px] opacity-75">
                ({tracks.filter(t => t.ep.includes('EP 3')).length})
              </span>
            </button>
            <button
              onClick={() => setActiveEp('EP 4')}
              className={`px-2 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 whitespace-nowrap cursor-pointer ${
                activeEp.includes('EP 4')
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : isDarkMode
                  ? 'text-slate-400 hover:text-white hover:bg-slate-900'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
              title="EP 4: The Surrender Sessions (Identity & Reliance)"
            >
              <span>EP 4: Surrender</span>
              <span className="font-mono text-[9px] opacity-75">
                ({tracks.filter(t => t.ep.includes('EP 4')).length})
              </span>
            </button>
          </div>

          {/* Right: Search + Add Track Button */}
          <div className="flex items-center gap-2">
            {onOpenSectionGuide && (
              <button
                type="button"
                onClick={() => onOpenSectionGuide('kanban')}
                className={`px-2.5 py-1 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  isDarkMode
                    ? 'bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border-amber-700/50 shadow-xs'
                    : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
                }`}
                title="View Kanban Pipeline Operating Guide & SOP Rules"
              >
                <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Kanban Guide & SOP</span>
                <span className="sm:hidden">Guide</span>
              </button>
            )}

            <div className="relative w-44 sm:w-52">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tracks, styles..."
                className={`w-full border rounded-xl pl-8 pr-2.5 py-1 text-xs focus:outline-none focus:border-indigo-500 transition ${
                  isDarkMode
                    ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500'
                    : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                }`}
              />
            </div>

            <button
              onClick={() => {
                if (onOpenCreateProject) {
                  onOpenCreateProject();
                } else {
                  const newIdNum = tracks.length + 1;
                  const newTrk: Track = {
                    id: `TRK-${String(newIdNum).padStart(2, '0')}`,
                    ep: activeEp !== 'ALL' ? (activeEp.includes('EP 1') ? 'EP 1: Restoration' : activeEp.includes('EP 2') ? 'EP 2: Conflict Suite' : activeEp.includes('EP 3') ? 'EP 3: War Room Anthems' : 'EP 4: Surrender Sessions') : 'EP 1: Restoration',
                    title: `New Song ${newIdNum}`,
                    status: "Idea / Concept",
                    genre: "Christian Hip Hop / Worship",
                    bpm: 96,
                    key: "D Minor",
                    vocal: "The Architect",
                    vocalCast: "The Architect (Sub-Sonic Quarry)",
                    thesis: "New theological thesis statement for BRICK Records.",
                    sunoPrompt: "High fidelity master, 96 BPM, Key of D Minor",
                    negativePrompt: "sibilance, high-frequency hiss, piercing treble, digital artifacts",
                    engineSliders: { weirdness: 12, styleInfluence: 65, voiceAudio: 100 },
                    lyrics: "[Verse 1]\nNew kingdom lyrics here...",
                    versions: [{ version: "v1.0", timestamp: new Date().toISOString().split('T')[0], reason: "Initial sketch", lyrics: "New kingdom lyrics here..." }],
                    selahPrayed: false
                  };
                  onAddNewTrack(newTrk);
                }
              }}
              className="px-2.5 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition cursor-pointer"
              title="Add New Track to Active Pipeline"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Track</span>
            </button>
          </div>

        </div>

        {/* TOP STACK ROW 2 (Double-Stacked Telemetry & EP Readiness Ribbon) */}
        <div className={`grid grid-cols-1 xl:grid-cols-12 gap-2 pt-1.5 border-t items-center text-[11px] ${
          isDarkMode ? 'border-slate-800/80' : 'border-slate-200'
        }`}>
          
          {/* Telemetry Chips (7 Cols on XL) */}
          <div className="xl:col-span-7 flex items-center gap-1.5 flex-wrap">
            <span className={`text-[10px] font-bold uppercase tracking-wider mr-1 hidden sm:inline ${
              isDarkMode ? 'text-slate-400' : 'text-slate-500'
            }`}>
              Telemetry:
            </span>
            
            <div className={`px-2 py-0.5 rounded-lg border flex items-center gap-1 font-mono ${
              isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <span className="text-slate-400">Total:</span>
              <strong className={isDarkMode ? 'text-white' : 'text-slate-900'}>{totalTracks}</strong>
            </div>

            <div className={`px-2 py-0.5 rounded-lg border flex items-center gap-1 font-mono ${
              isDarkMode ? 'bg-slate-950 border-rose-900/40 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-700'
            }`}>
              <CheckCircle className="w-3 h-3 text-rose-500" />
              <span>Released:</span>
              <strong className="font-bold">{releasedTracks.length}</strong>
            </div>

            <div className={`px-2 py-0.5 rounded-lg border flex items-center gap-1 font-mono ${
              isDarkMode ? 'bg-slate-950 border-emerald-900/40 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
            }`}>
              <Disc className="w-3 h-3 text-emerald-500" />
              <span>Ready:</span>
              <strong className="font-bold">{distributionTracks.length}</strong>
            </div>

            <div className={`px-2 py-0.5 rounded-lg border flex items-center gap-1 font-mono ${
              isDarkMode ? 'bg-slate-950 border-cyan-900/40 text-cyan-300' : 'bg-cyan-50 border-cyan-200 text-cyan-700'
            }`}>
              <Sparkles className="w-3 h-3 text-cyan-500" />
              <span>Master:</span>
              <strong className="font-bold">{audioMasterTracks.length}</strong>
            </div>

            <div className={`px-2 py-0.5 rounded-lg border flex items-center gap-1 font-mono ${
              isDarkMode ? 'bg-slate-950 border-indigo-900/40 text-indigo-300' : 'bg-indigo-50 border-indigo-200 text-indigo-700'
            }`}>
              <Activity className="w-3 h-3 text-indigo-500" />
              <span>In Prog:</span>
              <strong className="font-bold">{inProgressTracks.length}</strong>
            </div>

            <div className={`px-2 py-0.5 rounded-lg border flex items-center gap-1 font-mono ${
              isDarkMode ? 'bg-slate-950 border-blue-900/40 text-blue-300' : 'bg-blue-50 border-blue-200 text-blue-700'
            }`}>
              <FileText className="w-3 h-3 text-blue-500" />
              <span>Lyrics:</span>
              <strong className="font-bold">{lyricsFinalizedTracks.length}</strong>
            </div>

            <div className={`px-2 py-0.5 rounded-lg border flex items-center gap-1 font-mono ${
              isDarkMode ? 'bg-slate-950 border-amber-900/40 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}>
              <Heart className="w-3 h-3 text-amber-500 fill-amber-500" />
              <span>Selah:</span>
              <strong className="font-bold">{selahCompliancePercent}%</strong>
            </div>

            <div className={`px-2 py-0.5 rounded-lg border flex items-center gap-1 font-mono hidden md:flex ${
              isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <TrendingUp className="w-3 h-3 text-amber-500" />
              <span>Avg:</span>
              <strong className={isDarkMode ? 'text-white' : 'text-slate-900'}>{averageBpm} BPM</strong>
            </div>
          </div>

          {/* 4 Mini EP Readiness Progress Bars (5 Cols on XL) */}
          <div className="xl:col-span-5 grid grid-cols-4 gap-1.5">
            {epCollections.map((ep) => {
              const epTracks = tracks.filter(t => t.ep.toLowerCase().includes(ep.id.split(':')[0].toLowerCase()));
              const completedCount = epTracks.filter(t => t.status === 'Released' || t.status === 'Sent for Distribution' || t.status === 'Audio Master').length;
              const pct = epTracks.length > 0 ? Math.round((completedCount / epTracks.length) * 100) : 0;
              const shortEpName = ep.id.split(':')[0];

              return (
                <div 
                  key={ep.id} 
                  onClick={() => setActiveEp(shortEpName)}
                  className={`px-1.5 py-1 border rounded-lg flex flex-col justify-between cursor-pointer transition ${
                    activeEp.includes(shortEpName)
                      ? isDarkMode
                        ? 'border-indigo-500 bg-indigo-950/40'
                        : 'border-indigo-500 bg-indigo-50'
                      : isDarkMode
                      ? 'bg-slate-950 border-slate-800/80 hover:border-slate-700'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                  title={`${ep.title} (${completedCount}/${epTracks.length} Ready - ${pct}%)`}
                >
                  <div className="flex items-center justify-between text-[10px] leading-tight">
                    <span className={`font-bold truncate ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{shortEpName}</span>
                    <span className="font-mono text-[9px] text-slate-400">{pct}%</span>
                  </div>
                  <div className={`w-full h-1 rounded-full overflow-hidden mt-1 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'}`}>
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

        </div>

      </div>

      {/* =========================================================================
          VIEW 1: 7-COLUMN KANBAN BOARD (Flex-1 with Internal Scroll & Zero Outer Overflow)
          ========================================================================= */}
      {layoutMode === 'kanban' && (
        <div className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden pb-1 custom-scrollbar">
          <div className="flex gap-2.5 h-full min-w-[1400px]">
            {STATUS_COLUMNS.map(col => {
              const columnTracks = filteredTracks.filter(t => t.status === col.id);

              return (
                <div
                  key={col.id}
                  className={`w-72 border rounded-2xl p-2.5 flex flex-col flex-shrink-0 h-full overflow-hidden transition-colors ${
                    isDarkMode
                      ? 'bg-slate-900/60 border-slate-800/90'
                      : 'bg-slate-100/90 border-slate-200/90 shadow-2xs'
                  }`}
                >
                  {/* Column Header */}
                  <div className={`flex items-center justify-between pb-2 border-b mb-2 px-1 flex-shrink-0 ${
                    isDarkMode ? 'border-slate-800/80' : 'border-slate-200'
                  }`}>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${
                        col.id === 'Released' 
                          ? 'bg-rose-500 shadow-xs shadow-rose-400/50' 
                          : col.id === 'Sent for Distribution' 
                          ? 'bg-emerald-500 shadow-xs shadow-emerald-400/50' 
                          : col.id === 'Audio Master'
                          ? 'bg-cyan-500 shadow-xs shadow-cyan-400/50'
                          : col.id === 'UVR5 Stem Prep'
                          ? 'bg-purple-500'
                          : col.id === 'In Progress'
                          ? 'bg-indigo-500'
                          : col.id === 'Lyrics Finalized'
                          ? 'bg-blue-500'
                          : 'bg-amber-500'
                      }`} />
                      <h3 className={`text-xs font-bold tracking-wide ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        {col.title}
                      </h3>
                    </div>
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                      isDarkMode ? col.bgBadgeDark : col.bgBadgeLight
                    }`}>
                      {columnTracks.length}
                    </span>
                  </div>

                  {/* Column Card List - Scrollable vertically within this column ONLY */}
                  <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {columnTracks.map(trk => (
                      <div
                        key={trk.id}
                        className={`border rounded-2xl p-2.5 space-y-2 transition-all group shadow-2xs hover:shadow-md ${
                          isDarkMode
                            ? 'bg-slate-950 border-slate-800/90 hover:border-indigo-500/70 hover:shadow-indigo-950/40 text-slate-100'
                            : 'bg-white border-slate-200 hover:border-indigo-400 hover:shadow-indigo-500/10 text-slate-900'
                        }`}
                      >
                        {/* Card Top: ID, EP, Selah & Versions badge */}
                        <div className="flex items-center justify-between text-[10px]">
                          <div className="flex items-center gap-1">
                            <span className={`font-mono font-bold px-1.5 py-0.5 rounded border ${
                              isDarkMode
                                ? 'text-indigo-400 bg-indigo-950/80 border-indigo-800/50'
                                : 'text-indigo-700 bg-indigo-50 border-indigo-200'
                            }`}>
                              {trk.id}
                            </span>
                            <span className={`font-mono text-[9px] truncate max-w-[80px] ${
                              isDarkMode ? 'text-slate-400' : 'text-slate-500'
                            }`}>
                              {trk.ep.split(':')[0]}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            {trk.versions && trk.versions.length > 1 && (
                              <span className={`px-1.5 py-0.5 rounded border text-[9px] font-mono ${
                                isDarkMode
                                  ? 'bg-purple-950/80 text-purple-300 border-purple-800/40'
                                  : 'bg-purple-50 text-purple-700 border-purple-200'
                              }`} title={`${trk.versions.length} distinct arrangements/styles linked`}>
                                {trk.versions.length} styles
                              </span>
                            )}
                            {trk.selahPrayed && (
                              <span className="flex items-center gap-0.5 text-amber-500 text-[10px]" title="24h Selah Prayer Stationkept">
                                <Heart className="w-3 h-3 fill-amber-500" />
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Title & Thesis */}
                        <div>
                          <h4 
                            onClick={() => {
                              onSelectTrack(trk);
                              onNavigateToTab('lyrics');
                            }}
                            className={`text-xs font-bold transition cursor-pointer line-clamp-1 ${
                              isDarkMode
                                ? 'text-white group-hover:text-indigo-300'
                                : 'text-slate-900 group-hover:text-indigo-600'
                            }`}
                            title="Click to open track in Workbench"
                          >
                            {trk.title}
                          </h4>
                          <p className={`text-[10px] italic line-clamp-2 mt-0.5 leading-snug ${
                            isDarkMode ? 'text-slate-400' : 'text-slate-500'
                          }`}>
                            "{trk.thesis}"
                          </p>
                        </div>

                        {/* Genre & Vocal Formant */}
                        <div className={`text-[10px] flex items-center justify-between border-t pt-1 ${
                          isDarkMode ? 'border-slate-800/80 text-slate-400' : 'border-slate-100 text-slate-500'
                        }`}>
                          <span className={`truncate max-w-[120px] ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                            {trk.genre}
                          </span>
                          <span className="font-mono text-[9px]">{trk.bpm} BPM</span>
                        </div>

                        {/* Card Bottom: Quick Move Arrows & Open Workbench Action */}
                        <div className="flex items-center justify-between pt-1">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleMoveStatus(trk, 'prev')}
                              disabled={col.id === 'Idea / Concept'}
                              className={`p-1 rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed ${
                                isDarkMode ? 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900'
                              }`}
                              title="Revert Status"
                            >
                              <ArrowLeft className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleMoveStatus(trk, 'next')}
                              disabled={col.id === 'Released'}
                              className={`p-1 rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed ${
                                isDarkMode ? 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900'
                              }`}
                              title="Advance Status"
                            >
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>

                          <button
                            onClick={() => {
                              onSelectTrack(trk);
                              onNavigateToTab('lyrics');
                            }}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer ${
                              isDarkMode
                                ? 'bg-indigo-950 hover:bg-indigo-900 text-indigo-300'
                                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700'
                            }`}
                          >
                            <span>Open</span>
                            <ArrowRight className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {columnTracks.length === 0 && (
                      <div className={`text-center py-8 text-[11px] font-mono border border-dashed rounded-xl ${
                        isDarkMode ? 'border-slate-800/80 text-slate-600' : 'border-slate-200 text-slate-400'
                      }`}>
                        Empty Column
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 2: BENTO GRID MATRIX (Modular Asymmetric Bento Cards with Deep Polish)
          ========================================================================= */}
      {layoutMode === 'bento' && (
        <div className="flex-1 min-h-0 overflow-y-auto pr-1 pb-4 custom-scrollbar space-y-4">
          {/* Bento Grid Container */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredTracks.map(trk => {
              const statusCol = STATUS_COLUMNS.find(c => c.id === trk.status);

              return (
                <div
                  key={trk.id}
                  onClick={() => {
                    onSelectTrack(trk);
                    onNavigateToTab('lyrics');
                  }}
                  className={`rounded-3xl p-5 border transition-all duration-200 flex flex-col justify-between space-y-3 cursor-pointer group shadow-xs hover:shadow-lg hover:-translate-y-0.5 ${
                    isDarkMode
                      ? 'bg-slate-900/90 border-slate-800 hover:border-indigo-500/70 hover:shadow-indigo-950/40 text-slate-100'
                      : 'bg-white border-slate-200/90 hover:border-indigo-400 hover:shadow-indigo-500/10 text-slate-900'
                  }`}
                >
                  {/* Top Bar: ID, EP Badge, Status Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-lg font-mono text-xs font-bold border ${
                          isDarkMode
                            ? 'bg-indigo-950 text-indigo-300 border-indigo-800/50'
                            : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        }`}>
                          {trk.id}
                        </span>
                        <span className={`text-[11px] font-mono truncate max-w-[120px] ${
                          isDarkMode ? 'text-slate-400' : 'text-slate-500'
                        }`}>
                          {trk.ep.split(':')[0]}
                        </span>
                      </div>
                      <h3 className={`text-sm font-bold truncate group-hover:text-indigo-500 transition mt-1 ${
                        isDarkMode ? 'text-white' : 'text-slate-900'
                      }`}>
                        {trk.title}
                      </h3>
                    </div>

                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border flex-shrink-0 ${
                      isDarkMode ? statusCol?.bgBadgeDark : statusCol?.bgBadgeLight
                    }`}>
                      {trk.status}
                    </span>
                  </div>

                  {/* Thesis / Vision */}
                  <p className={`text-xs italic line-clamp-2 leading-relaxed ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    "{trk.thesis}"
                  </p>

                  {/* Musical Specs Compartment (Bento Sub-Card) */}
                  <div className={`p-2.5 rounded-2xl border grid grid-cols-3 gap-2 text-center text-[10px] font-mono ${
                    isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div>
                      <div className="text-slate-400 text-[9px] uppercase">BPM</div>
                      <div className={`font-bold mt-0.5 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{trk.bpm}</div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-[9px] uppercase">Key</div>
                      <div className={`font-bold mt-0.5 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{trk.key}</div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-[9px] uppercase">Styles</div>
                      <div className={`font-bold mt-0.5 ${isDarkMode ? 'text-purple-400' : 'text-purple-700'}`}>
                        {trk.versions?.length || 1}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Footer: Vocal Cast & Quick Actions */}
                  <div className={`flex items-center justify-between pt-2 border-t text-[11px] ${
                    isDarkMode ? 'border-slate-800/80 text-slate-400' : 'border-slate-100 text-slate-500'
                  }`}>
                    <span className="truncate max-w-[140px]">{trk.vocal}</span>

                    <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => {
                          onSelectTrack(trk);
                          onNavigateToTab('mixer');
                        }}
                        className={`p-1.5 rounded-xl border transition cursor-pointer ${
                          isDarkMode
                            ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-cyan-300'
                            : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-cyan-700'
                        }`}
                        title="Open in Mini-DAW"
                      >
                        <Scissors className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          onSelectTrack(trk);
                          onNavigateToTab('lyrics');
                        }}
                        className="px-2.5 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1 transition shadow-xs cursor-pointer"
                      >
                        <span>Open</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};
