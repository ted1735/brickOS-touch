import React, { useState } from 'react';
import {
  Home,
  FileText,
  Sliders,
  HardDrive,
  Grid,
  Play,
  Pause,
  Loader2,
  X,
  Plus,
  Search,
  ChevronRight,
  ChevronUp,
  Sun,
  Moon,
  Sparkles,
  Maximize2,
  Database,
  Check,
  Activity
} from 'lucide-react';
import { Track, StudioTheme } from '../types';
import { TIER_1_NAV_ITEMS, TIER_2_NAV_ITEMS } from '../data/studioNavigationData';

interface FoldableMobileDockProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedTrack: Track;
  tracks: Track[];
  onSelectTrack: (track: Track) => void;
  isPlaying: boolean;
  isLoadingAudio?: boolean;
  onTogglePlayPause: () => void;
  auditionBus: 'A' | 'B';
  onToggleAuditionBus: () => void;
  onOpenCreateProject: () => void;
  onOpenCommandPalette: () => void;
  onToggleFocusMode: () => void;
  onSyncDatabase: () => void;
  isDbSyncing?: boolean;
  studioTheme?: StudioTheme;
  onSelectTheme?: (theme: StudioTheme) => void;
  isDarkMode?: boolean;
}

/**
 * Samsung Galaxy Z Fold 8 Ultra & Touch-First Bottom Thumb Dock + Slide-Up Studio Drawer.
 * Visible on Cover Screen (<640px) and Unfolded Foldable Screens (<1024px); hidden on Desktop (lg:hidden).
 * Keeps primary navigation & audio transport inside the natural bottom thumb reach zone.
 */
export const FoldableMobileDock: React.FC<FoldableMobileDockProps> = ({
  activeTab,
  setActiveTab,
  selectedTrack,
  tracks,
  onSelectTrack,
  isPlaying,
  isLoadingAudio = false,
  onTogglePlayPause,
  auditionBus,
  onToggleAuditionBus,
  onOpenCreateProject,
  onOpenCommandPalette,
  onToggleFocusMode,
  onSyncDatabase,
  isDbSyncing = false,
  studioTheme = 'moon',
  onSelectTheme,
  isDarkMode = true
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerSection, setDrawerSection] = useState<'modules' | 'tracks'>('modules');
  const [trackFilter, setTrackFilter] = useState('');

  const primaryDestinations = [
    { id: 'home', label: 'Status', icon: Activity },
    { id: 'lyrics', label: 'Write', icon: FileText },
    { id: 'mixer', label: 'Mixer', icon: Sliders },
    { id: 'nextcloud_sync', label: 'Files', icon: HardDrive }
  ];

  const isSecondaryTab = !primaryDestinations.some((d) => d.id === activeTab);

  const filteredTracks = tracks.filter((t) => {
    if (!trackFilter.trim()) return true;
    const q = trackFilter.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      t.id.toLowerCase().includes(q) ||
      t.ep.toLowerCase().includes(q)
    );
  });

  const handleNavigate = (tabId: string) => {
    setActiveTab(tabId);
    setIsDrawerOpen(false);
  };

  return (
    <>
      {/* FIXED BOTTOM THUMB DOCK (Slim Audio Transport + 5 Thumb Destinations) */}
      <div
        className={`lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t backdrop-blur-xl pb-safe transition-colors ${
          isDarkMode
            ? 'bg-slate-950/92 border-slate-800/90 text-slate-100 shadow-[0_-8px_30px_rgba(0,0,0,0.45)]'
            : 'bg-white/95 border-slate-200 text-slate-900 shadow-[0_-8px_24px_rgba(15,23,42,0.08)]'
        }`}
      >
        {/* SLIM AUDIO TRANSPORT STRIP */}
        <div
          className={`px-3 py-1.5 flex items-center justify-between gap-2 border-b ${
            isDarkMode ? 'border-slate-800/70 bg-slate-900/70' : 'border-slate-200/80 bg-slate-50/90'
          }`}
        >
          {/* 44px Play/Pause Touch Target */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <button
              type="button"
              onClick={onTogglePlayPause}
              disabled={isLoadingAudio}
              className={`min-w-[44px] min-h-[44px] w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition active:scale-95 cursor-pointer shadow-sm ${
                isLoadingAudio
                  ? 'bg-amber-500 text-slate-950'
                  : isPlaying
                  ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-400/40'
                  : 'bg-indigo-600 text-white'
              }`}
              aria-label={isPlaying ? 'Pause Track' : 'Play Track'}
            >
              {isLoadingAudio ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5" />
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setDrawerSection('tracks');
                setIsDrawerOpen(true);
              }}
              className="min-w-0 flex-1 text-left py-1 cursor-pointer group"
              title="Tap to switch active track"
            >
              <div className="text-xs font-bold truncate flex items-center gap-1.5">
                <span className="truncate">{selectedTrack.title}</span>
              </div>
              <div className={`text-[11px] font-mono tabular-nums truncate ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {selectedTrack.id} · {selectedTrack.bpm} BPM · {selectedTrack.key}
              </div>
            </button>
          </div>

          {/* Right Thumb Transport Controls: A/B Bus + Jump to Mixer */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={onToggleAuditionBus}
              className={`min-h-[44px] px-2.5 rounded-xl font-mono text-xs font-bold border transition active:scale-95 cursor-pointer flex items-center gap-1 ${
                auditionBus === 'B'
                  ? 'bg-amber-500 text-slate-950 border-amber-400'
                  : isDarkMode
                  ? 'bg-slate-800 text-slate-200 border-slate-700'
                  : 'bg-slate-100 text-slate-800 border-slate-300'
              }`}
              title="Switch A/B Audition Bus (Master vs Stems)"
            >
              <span>{auditionBus === 'A' ? 'A:Mix' : 'B:Stem'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setDrawerSection('modules');
                setIsDrawerOpen(true);
              }}
              className={`min-w-[44px] min-h-[44px] rounded-xl border flex items-center justify-center transition active:scale-95 cursor-pointer ${
                isDarkMode
                  ? 'bg-slate-800 border-slate-700 text-slate-300'
                  : 'bg-slate-100 border-slate-300 text-slate-700'
              }`}
              aria-label="Open Studio Drawer"
            >
              <ChevronUp className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 5-DESTINATION BOTTOM THUMB BAR */}
        <nav
          aria-label="Primary Mobile Navigation"
          className="grid grid-cols-5 items-center h-14 px-1"
        >
          {primaryDestinations.map((dest) => {
            const Icon = dest.icon;
            const isActive = activeTab === dest.id;
            return (
              <button
                key={dest.id}
                type="button"
                onClick={() => handleNavigate(dest.id)}
                className={`min-h-[48px] flex flex-col items-center justify-center gap-0.5 rounded-xl transition active:scale-95 cursor-pointer ${
                  isActive
                    ? isDarkMode
                      ? 'text-cyan-400 font-bold'
                      : 'text-indigo-600 font-bold'
                    : isDarkMode
                    ? 'text-slate-400 hover:text-slate-200'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[11px] font-medium whitespace-nowrap truncate max-w-full">
                  {dest.label}
                </span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => {
              setDrawerSection('modules');
              setIsDrawerOpen((prev) => !prev);
            }}
            className={`min-h-[48px] flex flex-col items-center justify-center gap-0.5 rounded-xl transition active:scale-95 cursor-pointer ${
              isDrawerOpen || isSecondaryTab
                ? isDarkMode
                  ? 'text-indigo-400 font-bold'
                  : 'text-indigo-600 font-bold'
                : isDarkMode
                ? 'text-slate-400 hover:text-slate-200'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Grid className="w-5 h-5" />
            <span className="text-[11px] font-medium whitespace-nowrap">Studio</span>
          </button>
        </nav>
      </div>

      {/* SLIDE-UP STUDIO DRAWER SHEET (rounded-t-3xl) */}
      {isDrawerOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/65 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setIsDrawerOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-h-[86vh] rounded-t-3xl border-t shadow-2xl flex flex-col overflow-hidden pb-safe animate-in slide-in-from-bottom duration-200 ${
              isDarkMode
                ? 'bg-slate-950 border-slate-800 text-slate-100'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            {/* Drag Handle & Sheet Header */}
            <div className="pt-3 pb-2 px-5 border-b border-slate-800/60 shrink-0">
              <div className={`w-10 h-1.5 rounded-full mx-auto mb-3 ${isDarkMode ? 'bg-slate-700' : 'bg-slate-300'}`} />
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900/80 border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setDrawerSection('modules')}
                    className={`min-h-[40px] px-3.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      drawerSection === 'modules'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Studio Modules
                  </button>
                  <button
                    type="button"
                    onClick={() => setDrawerSection('tracks')}
                    className={`min-h-[40px] px-3.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      drawerSection === 'tracks'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Tracks ({tracks.length})
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className={`min-w-[44px] min-h-[44px] rounded-xl border flex items-center justify-center cursor-pointer ${
                    isDarkMode
                      ? 'bg-slate-900 border-slate-800 text-slate-300'
                      : 'bg-slate-100 border-slate-300 text-slate-700'
                  }`}
                  aria-label="Close Studio Drawer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Sheet Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {drawerSection === 'modules' ? (
                <>
                  {/* Quick Studio Actions Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsDrawerOpen(false);
                        onOpenCreateProject();
                      }}
                      className="min-h-[48px] px-3 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>New Project</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsDrawerOpen(false);
                        onOpenCommandPalette();
                      }}
                      className={`min-h-[48px] px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 active:scale-95 transition cursor-pointer ${
                        isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-slate-100 border-slate-300 text-slate-800'
                      }`}
                    >
                      <Search className="w-4 h-4 text-indigo-400" />
                      <span>Search All</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onSyncDatabase();
                      }}
                      className={`min-h-[48px] px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 active:scale-95 transition cursor-pointer ${
                        isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-slate-100 border-slate-300 text-slate-800'
                      }`}
                    >
                      <Database className={`w-4 h-4 text-cyan-400 ${isDbSyncing ? 'animate-spin' : ''}`} />
                      <span>{isDbSyncing ? 'Syncing...' : 'Cloud Sync'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsDrawerOpen(false);
                        onToggleFocusMode();
                      }}
                      className={`min-h-[48px] px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 active:scale-95 transition cursor-pointer ${
                        isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-slate-100 border-slate-300 text-slate-800'
                      }`}
                    >
                      <Maximize2 className="w-4 h-4 text-purple-400" />
                      <span>Focus Mode</span>
                    </button>
                  </div>

                  {/* Tier 1: Core Audio & Production */}
                  <div className="space-y-2">
                    <h3 className={`text-xs font-semibold px-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      Core Production & Mixing
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {TIER_1_NAV_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const active = activeTab === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleNavigate(item.id)}
                            className={`min-h-[52px] p-3 rounded-xl border text-left flex items-center gap-2.5 transition active:scale-[0.98] cursor-pointer ${
                              active
                                ? 'bg-indigo-600/20 border-indigo-500 text-white'
                                : isDarkMode
                                ? 'bg-slate-900/70 border-slate-800 text-slate-200 hover:bg-slate-900'
                                : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                            }`}
                          >
                            <Icon className={`w-5 h-5 shrink-0 ${active ? 'text-indigo-400' : item.accentColor}`} />
                            <span className="text-xs font-semibold truncate">{item.shortName}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Tier 2: Visuals, Distribution & Copilots */}
                  <div className="space-y-2">
                    <h3 className={`text-xs font-semibold px-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      Visuals, AI Copilots & Release
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {TIER_2_NAV_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const active = activeTab === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleNavigate(item.id)}
                            className={`min-h-[52px] p-3 rounded-xl border text-left flex items-center gap-2.5 transition active:scale-[0.98] cursor-pointer ${
                              active
                                ? 'bg-indigo-600/20 border-indigo-500 text-white'
                                : isDarkMode
                                ? 'bg-slate-900/70 border-slate-800 text-slate-200 hover:bg-slate-900'
                                : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                            }`}
                          >
                            <Icon className={`w-5 h-5 shrink-0 ${active ? 'text-indigo-400' : item.accentColor}`} />
                            <span className="text-xs font-semibold truncate">{item.shortName}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Quick Theme Strip */}
                  {onSelectTheme && (
                    <div className="space-y-2 pt-1">
                      <h3 className={`text-xs font-semibold px-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        Studio Display Theme
                      </h3>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {(['moon', 'stars', 'sun', 'graphite', 'console', 'clean'] as StudioTheme[]).map((themeKey) => (
                          <button
                            key={themeKey}
                            type="button"
                            onClick={() => onSelectTheme(themeKey)}
                            className={`min-h-[44px] px-2.5 rounded-xl border text-xs font-semibold capitalize flex items-center justify-center gap-1.5 cursor-pointer transition ${
                              studioTheme === themeKey
                                ? 'bg-indigo-600 text-white border-indigo-400'
                                : isDarkMode
                                ? 'bg-slate-900 border-slate-800 text-slate-300'
                                : 'bg-slate-100 border-slate-300 text-slate-700'
                            }`}
                          >
                            {themeKey === 'sun' ? <Sun className="w-3.5 h-3.5" /> : themeKey === 'stars' ? <Sparkles className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                            <span>{themeKey}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* TRACKS LIST (Tap 56px rows to switch track immediately) */
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={trackFilter}
                      onChange={(e) => setTrackFilter(e.target.value)}
                      placeholder="Filter catalog tracks by title, ID, or EP..."
                      className={`w-full min-h-[44px] pl-10 pr-4 rounded-xl border text-sm focus:outline-none ${
                        isDarkMode
                          ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-500'
                          : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                      }`}
                    />
                  </div>

                  <div className="divide-y divide-slate-800/60 rounded-2xl border border-slate-800/80 overflow-hidden">
                    {filteredTracks.map((t) => {
                      const isSelected = t.id === selectedTrack.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            onSelectTrack(t);
                            setIsDrawerOpen(false);
                          }}
                          className={`w-full min-h-[60px] px-4 py-3 flex items-center justify-between gap-3 text-left transition active:bg-indigo-950/40 cursor-pointer ${
                            isSelected
                              ? isDarkMode
                                ? 'bg-indigo-950/60 text-white'
                                : 'bg-indigo-50 text-indigo-950'
                              : isDarkMode
                              ? 'bg-slate-900/40 hover:bg-slate-900 text-slate-200'
                              : 'bg-white hover:bg-slate-50 text-slate-900'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-bold truncate flex items-center gap-2">
                              <span>{t.title}</span>
                              {isSelected && <Check className="w-4 h-4 text-cyan-400 shrink-0" />}
                            </div>
                            <div className={`text-xs font-mono tabular-nums truncate mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                              {t.id} · {t.ep} · {t.bpm} BPM · {t.status}
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
