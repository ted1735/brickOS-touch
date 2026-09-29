import React from 'react';
import {
  HardDrive,
  Zap,
  Search,
  MessageSquare,
  Music,
  Film,
  Sparkles,
  ShieldCheck,
  Radio,
  Database,
  Layers,
  Plus,
  Sun,
  Moon,
  HelpCircle
} from 'lucide-react';
import { Track } from '../types';
import { CURRENT_STUDIO_VERSION } from '../utils/versioning';

interface NavigationHeaderProps {
  selectedTrack: Track;
  onOpenStorage: () => void;
  onOpenSunoBridge: () => void;
  onOpenSearch: () => void;
  onOpenChat: () => void;
  onOpenCreateProject?: () => void;
  onOpenSectionGuide?: (sectionId?: any) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedEpFilter?: string;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
}

export const NavigationHeader: React.FC<NavigationHeaderProps> = ({
  selectedTrack,
  onOpenStorage,
  onOpenSunoBridge,
  onOpenSearch,
  onOpenChat,
  onOpenCreateProject,
  onOpenSectionGuide,
  activeTab,
  setActiveTab,
  selectedEpFilter = 'ALL',
  isDarkMode = true,
  onToggleTheme
}) => {
  return (
    <header
      className={`px-6 py-3 flex items-center justify-between gap-4 sticky top-0 z-40 backdrop-blur-md flex-shrink-0 transition-colors duration-200 ${
        isDarkMode
          ? 'bg-slate-900/95 border-b border-slate-800 text-white'
          : 'bg-white/95 border-b border-slate-200 text-slate-900 shadow-sm'
      }`}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={() => setActiveTab('kanban')}
          className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-amber-500 flex items-center justify-center font-black text-white text-xl shadow-lg shadow-indigo-500/25 ring-1 ring-white/20 hover:scale-105 active:scale-95 transition cursor-pointer"
          title="Return to Master Kanban Dashboard"
        >
          b
        </button>
        <div>
          <div className="flex items-center gap-2">
            <h1 
              onClick={() => setActiveTab('kanban')}
              className={`text-base font-black tracking-wider transition cursor-pointer ${
                isDarkMode ? 'text-white hover:text-indigo-300' : 'text-slate-900 hover:text-indigo-600'
              }`}
              title="Return to Master Kanban Dashboard"
            >
              brickOS MASTER STUDIO
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 font-mono text-[10px] font-bold border border-indigo-500/30">
              {CURRENT_STUDIO_VERSION}
            </span>
            <button
              onClick={() => setActiveTab('nextcloud_sync')}
              className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-mono text-[10px] font-semibold border border-emerald-500/30 hover:bg-emerald-500/20 transition cursor-pointer"
              title="Nextcloud Sync & Asset Matcher"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              WebDAV / 207332
            </button>
          </div>
          <p className={`text-[11px] flex items-center gap-2 flex-wrap ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            <span>Ted Moyer (Primary Artist / OAC)</span>
            <span>•</span>
            <span className="text-indigo-500 font-medium">BRICK Records</span>
            <span>•</span>
            {activeTab === 'kanban' ? (
              <span className="text-amber-500 font-medium bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                {selectedEpFilter === 'ALL' ? 'All 4 EPs (26 Master Tracks)' : selectedEpFilter}
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <span className="text-indigo-500 font-bold">{selectedTrack.id}: {selectedTrack.title}</span>
                <span>•</span>
                <span className="text-amber-500 font-medium">{selectedTrack.ep}</span>
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Global Actions Bar */}
      <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
        <button
          onClick={() => setActiveTab('kanban')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition shadow-sm cursor-pointer ${
            activeTab === 'kanban'
              ? 'bg-indigo-600 border-indigo-500 text-white'
              : isDarkMode
              ? 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border-slate-700'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
          }`}
          title="Master Kanban Pipeline Dashboard"
        >
          <Layers className="w-3.5 h-3.5 text-indigo-400" />
          <span>Dashboard</span>
        </button>

        <button
          onClick={() => setActiveTab('nextcloud_sync')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition shadow-sm cursor-pointer ${
            activeTab === 'nextcloud_sync'
              ? 'bg-indigo-600 border-indigo-500 text-white'
              : isDarkMode
              ? 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border-slate-700'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
          }`}
          title="Nextcloud WebDAV & Folder 207332 Asset Matcher"
        >
          <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden sm:inline">Nextcloud Matcher</span>
          <span className="sm:hidden">Nextcloud</span>
        </button>

        <button
          onClick={onOpenSearch}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition shadow-sm cursor-pointer ${
            isDarkMode
              ? 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border-slate-700'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
          }`}
          title="Google Search Grounding (gemini-3.8-flash)"
        >
          <Search className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden md:inline">Grounding</span>
        </button>

        <button
          onClick={onOpenChat}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition shadow-sm cursor-pointer ${
            isDarkMode
              ? 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border-slate-700'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
          }`}
          title="Studio Co-Producer Gemini Chatbot"
        >
          <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
          <span className="hidden md:inline">Co-Producer</span>
        </button>

        <button
          onClick={() => setActiveTab('database')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition shadow-sm cursor-pointer ${
            activeTab === 'database'
              ? 'bg-indigo-600 border-indigo-500 text-white'
              : isDarkMode
              ? 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border-slate-700'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
          }`}
          title="Master Track Catalog & Interchangeable Similarity Matrix"
        >
          <Database className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden lg:inline">Master Catalog</span>
        </button>

        {onOpenCreateProject && (
          <button
            onClick={onOpenCreateProject}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-950/40 transition border border-emerald-400/30 cursor-pointer"
            title="Create New Track Project (Standard Schema v1.0)"
          >
            <Plus className="w-3.5 h-3.5 text-white" />
            <span>+ New Project</span>
          </button>
        )}

        <button
          onClick={onOpenSunoBridge}
          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-950/50 transition border border-indigo-400/30 cursor-pointer"
          title="Suno & NightCafe 1-Click Bridge"
        >
          <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
          <span className="hidden sm:inline">⚡ Suno Bridge</span>
        </button>

        {/* SECTION GUIDE & SOP BUTTON */}
        {onOpenSectionGuide && (
          <button
            onClick={() => onOpenSectionGuide(activeTab)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition shadow-sm cursor-pointer ${
              isDarkMode
                ? 'bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border-amber-700/50'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
            }`}
            title="Open Section Guide & Nashville SOP Rules"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Guide & SOP</span>
            <span className="sm:hidden">Guide</span>
          </button>
        )}

        {/* LIGHT / DARK MODE TOGGLE SWITCH */}
        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            className={`p-2 rounded-xl border flex items-center gap-1.5 transition cursor-pointer ${
              isDarkMode
                ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
            }`}
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle Light and Dark Mode"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            <span className="text-xs font-bold hidden xl:inline">
              {isDarkMode ? 'Light' : 'Dark'}
            </span>
          </button>
        )}
      </div>
    </header>
  );
};
