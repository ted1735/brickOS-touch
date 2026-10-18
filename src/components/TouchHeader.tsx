import React from 'react';
import {
  Search,
  Maximize2,
  Minimize2,
  Database,
  Cloud,
  Sun,
  Moon,
  Palette,
  SlidersHorizontal,
  Plus
} from 'lucide-react';
import { Track } from '../types';

interface TouchHeaderProps {
  selectedTrack: Track;
  onOpenCommandPalette: () => void;
  onToggleFocusMode: () => void;
  isFocusMode: boolean;
  onToggleTheme: () => void;
  isDarkMode?: boolean;
  isDbConnected?: boolean;
  isDbSyncing?: boolean;
  cloudSyncError?: string | null;
  onNavigateHome: () => void;
  onOpenCreateProject: () => void;
  onOpenThemeModal: () => void;
}

export const TouchHeader: React.FC<TouchHeaderProps> = ({
  selectedTrack,
  onOpenCommandPalette,
  onToggleFocusMode,
  isFocusMode,
  onToggleTheme,
  isDarkMode = true,
  isDbConnected = true,
  isDbSyncing = false,
  cloudSyncError = null,
  onNavigateHome,
  onOpenCreateProject,
  onOpenThemeModal
}) => {
  return (
    <header
      className={`px-3 sm:px-5 py-2 flex items-center justify-between gap-2 sticky top-0 z-40 backdrop-blur-xl transition-colors duration-200 select-none ${
        isDarkMode
          ? 'bg-slate-950/90 border-b border-slate-800/90 text-white shadow-md'
          : 'bg-white/90 border-b border-slate-200/90 text-slate-900 shadow-xs'
      }`}
    >
      {/* LEFT: COMPACT LOGO + IDENTITY PILL */}
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          type="button"
          onClick={onNavigateHome}
          className="w-10 h-10 min-w-[40px] rounded-xl bg-slate-900 border border-indigo-500/40 p-1 flex items-center justify-center shadow-md shadow-indigo-950/40 active:scale-95 transition cursor-pointer overflow-hidden shrink-0 group"
          title="Return to Studio Home"
        >
          <img
            src="/brick-logo.webp"
            alt="brickOS Touch Logo"
            className="w-full h-full object-contain group-hover:scale-105 transition"
          />
        </button>

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              onClick={onNavigateHome}
              className="text-base sm:text-lg font-black tracking-wider cursor-pointer hover:text-indigo-400 transition truncate"
            >
              brickOS
            </span>
            <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono text-[10px] font-bold border border-indigo-500/30">
              Touch
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono text-[9px] font-semibold border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>WebDAV</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 truncate">
            <span className="text-indigo-400 font-bold truncate max-w-[140px] sm:max-w-[220px]">
              {selectedTrack.id}: {selectedTrack.title}
            </span>
            <span>•</span>
            <span className="text-amber-400 font-medium truncate">{selectedTrack.ep}</span>
          </div>
        </div>
      </div>

      {/* RIGHT: COMPACT TOUCH ACTIONS (Search, New Project, Theme, Focus Mode) */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        {/* Quick Search / Command Palette (44px target) */}
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className={`touch-target w-10 h-10 rounded-xl border flex items-center justify-center transition active:scale-95 cursor-pointer ${
            isDarkMode
              ? 'bg-slate-900 border-slate-700/80 text-slate-300 hover:text-white'
              : 'bg-slate-100 border-slate-300 text-slate-700'
          }`}
          title="Search tracks, stages & stems (Cmd+K)"
          aria-label="Search"
        >
          <Search className="w-4 h-4 text-indigo-400" />
        </button>

        {/* New Project Button */}
        <button
          type="button"
          onClick={onOpenCreateProject}
          className="touch-target h-10 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-950/40 transition active:scale-95 border border-emerald-400/30 cursor-pointer"
          title="Create New Project"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden md:inline">New</span>
        </button>

        {/* Palette / Theme Selector */}
        <button
          type="button"
          onClick={onOpenThemeModal}
          className={`touch-target w-10 h-10 rounded-xl border flex items-center justify-center transition active:scale-95 cursor-pointer ${
            isDarkMode
              ? 'bg-slate-900 border-slate-700/80 text-slate-300 hover:text-white'
              : 'bg-slate-100 border-slate-300 text-slate-700'
          }`}
          title="Change Studio Theme"
          aria-label="Theme Selector"
        >
          <Palette className="w-4 h-4 text-purple-400" />
        </button>

        {/* Focus Mode Toggle */}
        <button
          type="button"
          onClick={onToggleFocusMode}
          className={`touch-target w-10 h-10 rounded-xl border flex items-center justify-center transition active:scale-95 cursor-pointer ${
            isFocusMode
              ? 'bg-amber-500 text-slate-950 border-amber-400'
              : isDarkMode
              ? 'bg-slate-900 border-slate-700/80 text-slate-300 hover:text-white'
              : 'bg-slate-100 border-slate-300 text-slate-700'
          }`}
          title="Toggle Full Focus Mode"
          aria-label="Toggle Focus Mode"
        >
          <Maximize2 className="w-4 h-4 text-amber-400" />
        </button>
      </div>
    </header>
  );
};
