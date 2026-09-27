import React, { useState } from 'react';
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
  RefreshCw,
  Folder,
  ShieldCheck,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { Track, TrackStatus, CompositionSession, GeneratedImage, GeneratedVideo } from '../types';
import { EP_COLLECTIONS } from '../data/canonicalCatalog';
import { audioMiniDaw } from '../utils/audioEngine';
import { TIER_1_NAV_ITEMS, TIER_2_NAV_ITEMS, StudioNavItem } from '../data/studioNavigationData';

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
  isDbSyncing?: boolean;
  activeTab: string;
  onNavigateToTab: (tab: any) => void;
  activePanelTab: 'projects' | 'sessions' | 'assets';
  onSetActivePanelTab: (tab: 'projects' | 'sessions' | 'assets') => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onClose?: () => void;
  isDarkMode?: boolean;
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
  isDbSyncing = false,
  activeTab,
  onNavigateToTab,
  activePanelTab,
  onSetActivePanelTab,
  isCollapsed,
  onToggleCollapse,
  onClose,
  isDarkMode = true
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
  const [assetFilter, setAssetFilter] = useState<'all' | 'stems' | 'lyrics' | 'visuals' | 'videos'>('all');
  const [playingStemId, setPlayingStemId] = useState<number | null>(null);

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
      // Start preview
      audioMiniDaw.startPlayback(
        [
          { id: 1, name: 'Inst', vol: stemId === 3 ? 90 : 0, pan: 0, muted: stemId !== 3, solo: stemId === 3, trimIn: 0, trimOut: 120, freq: 440, waveType: 'sawtooth', color: '#6366f1' },
          { id: 2, name: 'Voc', vol: stemId === 1 ? 95 : 0, pan: 0, muted: stemId !== 1, solo: stemId === 1, trimIn: 0, trimOut: 120, freq: 440, waveType: 'triangle', color: '#ec4899' },
          { id: 3, name: 'Harm', vol: stemId === 2 ? 80 : 0, pan: 0, muted: stemId !== 2, solo: stemId === 2, trimIn: 0, trimOut: 120, freq: 440, waveType: 'sine', color: '#8b5cf6' },
          { id: 4, name: 'Drums', vol: stemId === 4 ? 85 : 0, pan: 0, muted: stemId !== 4, solo: stemId === 4, trimIn: 0, trimOut: 120, freq: 440, waveType: 'square', color: '#10b981' }
        ],
        selectedTrack.bpm
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
      <aside className="w-18 sm:w-20 bg-slate-900 border-r border-slate-800 flex flex-col items-center py-3.5 space-y-3 h-full flex-shrink-0 z-30 shadow-xl transition-all duration-200 overflow-y-auto custom-scrollbar">
        {/* Expand Button */}
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer shadow-sm border border-slate-700/50"
          title="Expand Side Navigation Panel (Full View)"
        >
          <ChevronRight className="w-4 h-4 text-indigo-400" />
        </button>

        <div className="h-px w-10 bg-slate-800 my-0.5" />

        {/* Tab Quick Toggles: Projects, Sessions, Assets */}
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={() => {
              onSetActivePanelTab('projects');
              onToggleCollapse();
            }}
            className={`p-2 rounded-xl transition cursor-pointer relative ${
              activePanelTab === 'projects' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/60' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
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
              activePanelTab === 'sessions' ? 'bg-purple-600 text-white shadow-md shadow-purple-950/60' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
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
              activePanelTab === 'assets' ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950/60' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Studio Assets (Stems, Artworks, Video Reels) — Click to expand"
          >
            <HardDrive className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400" />
          </button>
        </div>

        <div className="h-px w-10 bg-slate-800 my-0.5" />

        {/* TWO-COLUMN / TWO-ROW QUICK LAUNCHER ICONS (TIER 1 & TIER 2) */}
        <div className="w-full px-1.5 flex flex-col items-center space-y-1.5">
          <div className="flex items-center justify-between w-full px-1 text-[8px] font-mono uppercase font-black text-slate-500">
            <span title="Tier 1: Audio Engine">T1</span>
            <span title="Tier 2: Visuals & Copilots">T2</span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 w-full">
            {/* Col 1: Tier 1 Audio Icons */}
            <div className="flex flex-col gap-1.5 items-center">
              {TIER_1_NAV_ITEMS.map((item) => {
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
                        : 'bg-slate-950/80 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-white'
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
              {TIER_2_NAV_ITEMS.map((item) => {
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
                        : 'bg-slate-950/80 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-white'
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
            <div className="p-3.5 rounded-2xl shadow-2xl border backdrop-blur-xl bg-slate-900/95 border-slate-700/80 text-white shadow-indigo-950/80 ring-1 ring-white/10 relative">
              {/* Arrow pointing left back to the icon */}
              <div className="absolute left-[-6px] top-6 w-3 h-3 rotate-45 border-l border-b border-slate-700/80 bg-slate-900" />

              <div className="flex items-start gap-2.5 mb-2 relative z-10">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
                  activeTab === sidebarHoverItem.item.id
                    ? `${sidebarHoverItem.item.activeBg} text-white`
                    : 'bg-slate-800 text-indigo-400 border border-slate-700'
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

              <p className="text-[11px] leading-relaxed text-slate-300 mb-2 relative z-10">
                {sidebarHoverItem.item.description}
              </p>

              {sidebarHoverItem.item.sopRule && (
                <div className="p-2 rounded-xl border text-[10px] leading-tight flex items-start gap-1.5 mb-2 bg-amber-950/40 border-amber-800/40 text-amber-300 relative z-10">
                  <span className="font-bold">SOP:</span>
                  <span>{sidebarHoverItem.item.sopRule}</span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-400 relative z-10">
                <span className="text-indigo-400 font-bold flex items-center gap-1">
                  <ArrowRight className="w-3 h-3" />
                  <span>Click to open workspace</span>
                </span>
                {sidebarHoverItem.item.shortcut && (
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-bold">
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
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
              bOS
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
            <div className={`p-2.5 rounded-xl border space-y-1 ${
              isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Active Track Assets</span>
                <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded border ${
                  isDarkMode
                    ? 'text-cyan-400 bg-cyan-950/80 border-cyan-800/40'
                    : 'text-cyan-700 bg-cyan-50 border-cyan-200'
                }`}>
                  {selectedTrack.id}
                </span>
              </div>
              <p className={`text-[10px] truncate ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{selectedTrack.title} ({selectedTrack.ep})</p>
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
                Stems (4)
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
                    <span>UVR5 Isolated Stems (24-bit/48kHz)</span>
                  </span>
                  <button
                    onClick={() => onNavigateToTab('mixer')}
                    className="text-[10px] text-cyan-500 hover:text-cyan-600 font-mono font-bold"
                  >
                    Open DAW →
                  </button>
                </div>

                <div className="space-y-1.5">
                  {activeStems.map((stem) => (
                    <div
                      key={stem.id}
                      className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition ${
                        isDarkMode
                          ? 'bg-slate-950 border-slate-800 hover:border-slate-700'
                          : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                      }`}
                    >
                      <div className="space-y-0.5 min-w-0 pr-2">
                        <div className={`font-bold text-[11px] truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                          {stem.name}
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
                        <a
                          href="#download-stem"
                          onClick={(e) => {
                            e.preventDefault();
                            setDownloadNotice(`Downloading ${stem.name} (${stem.format})`);
                            setTimeout(() => setDownloadNotice(null), 3500);
                          }}
                          className={`p-1.5 rounded-lg transition ${
                            isDarkMode
                              ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                          title="Download high-resolution stem WAV"
                        >
                          <Download className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  ))}
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
                  <button
                    onClick={() => onNavigateToTab('veo_visuals')}
                    className="text-[10px] text-purple-500 hover:text-purple-600 font-mono font-bold"
                  >
                    Open Studio →
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {generatedImages.map((img) => (
                    <div
                      key={img.id}
                      className={`group relative rounded-xl overflow-hidden border aspect-square ${
                        isDarkMode ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-slate-100'
                      }`}
                    >
                      <img src={img.url} alt={img.prompt} className="w-full h-full object-cover group-hover:scale-105 transition" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition p-2 flex flex-col justify-end text-[9px] text-white">
                        <span className="font-bold truncate">{img.trackTitle || selectedTrack.title}</span>
                        <span className="text-slate-300 font-mono">{img.aspectRatio}</span>
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
                  <button
                    onClick={() => onNavigateToTab('veo_visuals')}
                    className="text-[10px] text-amber-500 hover:text-amber-600 font-mono font-bold"
                  >
                    Open Veo →
                  </button>
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
                          <div className={`text-[10px] font-bold truncate max-w-[170px] ${
                            isDarkMode ? 'text-white' : 'text-slate-900'
                          }`}>{vid.prompt}</div>
                          <div className="text-[9px] font-mono text-amber-500">{vid.status.toUpperCase()} • {vid.aspectRatio}</div>
                        </div>
                        <button
                          onClick={() => onNavigateToTab('veo_visuals')}
                          className={`px-2 py-1 rounded text-[9px] font-bold ${
                            isDarkMode
                              ? 'bg-slate-800 hover:bg-slate-700 text-amber-300'
                              : 'bg-slate-100 hover:bg-slate-200 text-amber-800'
                          }`}
                        >
                          View
                        </button>
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
    </aside>
  );
};
