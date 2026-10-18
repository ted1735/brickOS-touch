import React from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Headphones,
  PenTool,
  Sliders,
  Layers,
  Sparkles,
  Grid,
  FolderKanban,
  Volume2,
  VolumeX,
  Loader2,
  Maximize2
} from 'lucide-react';
import { Track } from '../types';

export type TouchStudioMode = 'listen' | 'write' | 'mix' | 'pro';

interface TouchBottomDockProps {
  currentMode: TouchStudioMode;
  onSelectMode: (mode: TouchStudioMode) => void;
  isPlaying: boolean;
  isLoadingAudio?: boolean;
  onTogglePlayPause: () => void;
  selectedTrack: Track;
  onPreviousTrack: () => void;
  onNextTrack: () => void;
  auditionBus: 'A' | 'B';
  onToggleAuditionBus: () => void;
  onOpenTracksDrawer: () => void;
  onOpenToolsDrawer: () => void;
  onToggleWhiteboard: () => void;
  isWhiteboardActive: boolean;
  isDarkMode?: boolean;
}

export const TouchBottomDock: React.FC<TouchBottomDockProps> = ({
  currentMode,
  onSelectMode,
  isPlaying,
  isLoadingAudio = false,
  onTogglePlayPause,
  selectedTrack,
  onPreviousTrack,
  onNextTrack,
  auditionBus,
  onToggleAuditionBus,
  onOpenTracksDrawer,
  onOpenToolsDrawer,
  onToggleWhiteboard,
  isWhiteboardActive,
  isDarkMode = true,
}) => {
  return (
    <div className="fixed bottom-0 inset-x-0 z-50 select-none pointer-events-auto">
      {/* Outer Glassmorphic Dock Container */}
      <div
        className={`w-full border-t backdrop-blur-2xl transition-all duration-200 touch-dock-safe ${
          isDarkMode
            ? 'bg-slate-950/92 border-slate-800/90 text-white shadow-2xl shadow-black/80'
            : 'bg-white/92 border-slate-200/90 text-slate-900 shadow-2xl shadow-slate-900/10'
        }`}
      >
        <div className="max-w-7xl mx-auto px-2 sm:px-4 pt-2 flex flex-col gap-1.5">
          {/* ROW 1: PRIMARY PLAYBACK TRANSPORT & AUDITIONING BUS */}
          <div className="flex items-center justify-between gap-2">
            {/* Left: Active Track Pill & Quick Sheet Drawer Trigger */}
            <button
              type="button"
              onClick={onOpenTracksDrawer}
              className={`flex items-center gap-2 p-1.5 pr-3 rounded-2xl border transition-all active:scale-95 cursor-pointer max-w-[190px] sm:max-w-[260px] truncate ${
                isDarkMode
                  ? 'bg-slate-900/90 hover:bg-slate-800/90 border-slate-700/80 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-900'
              }`}
              title="Browse 26 Nashville Catalog Tracks"
            >
              <div className="w-8 h-8 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center shrink-0 text-indigo-400 font-mono text-xs font-bold">
                {selectedTrack.id}
              </div>
              <div className="flex flex-col text-left truncate">
                <span className="text-xs font-bold truncate leading-tight">
                  {selectedTrack.title}
                </span>
                <span className="text-[10px] font-mono text-slate-400 leading-none truncate">
                  {selectedTrack.bpm} BPM • {selectedTrack.key}
                </span>
              </div>
            </button>

            {/* Center: Tactile Audio Controls (Prev, Big Play, Next) */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={onPreviousTrack}
                className={`touch-target w-11 h-11 rounded-2xl border flex items-center justify-center transition active:scale-90 cursor-pointer ${
                  isDarkMode
                    ? 'bg-slate-900/90 hover:bg-slate-800 border-slate-700/80 text-slate-300'
                    : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                }`}
                title="Previous Track"
                aria-label="Previous Track"
              >
                <SkipBack className="w-4 h-4 fill-current" />
              </button>

              <button
                type="button"
                onClick={onTogglePlayPause}
                disabled={isLoadingAudio}
                className={`touch-target w-12 h-12 rounded-2xl flex items-center justify-center font-bold shadow-xl transition-all duration-200 active:scale-90 cursor-pointer ${
                  isLoadingAudio
                    ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-400/50 cursor-wait'
                    : isPlaying
                    ? 'bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 shadow-amber-500/30 ring-2 ring-amber-400/50'
                    : 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-indigo-600/40 ring-1 ring-white/20'
                }`}
                title={isLoadingAudio ? 'Buffering Nextcloud lossless audio...' : isPlaying ? 'Pause Audio' : 'Play Audio'}
                aria-label={isPlaying ? 'Pause' : 'Play'}
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
                onClick={onNextTrack}
                className={`touch-target w-11 h-11 rounded-2xl border flex items-center justify-center transition active:scale-90 cursor-pointer ${
                  isDarkMode
                    ? 'bg-slate-900/90 hover:bg-slate-800 border-slate-700/80 text-slate-300'
                    : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                }`}
                title="Next Track"
                aria-label="Next Track"
              >
                <SkipForward className="w-4 h-4 fill-current" />
              </button>
            </div>

            {/* Right: 1-Tap A/B Auditioning Bus Segmented Control */}
            <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={onToggleAuditionBus}
                className={`touch-target h-10 px-3 rounded-xl font-mono text-xs font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 ${
                  auditionBus === 'A'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/40'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Bus A: Full 24-bit Master Mix"
              >
                <span className="w-2 h-2 rounded-full bg-indigo-400" />
                <span>A</span>
                <span className="hidden sm:inline text-[10px] opacity-80">Master</span>
              </button>
              <button
                type="button"
                onClick={onToggleAuditionBus}
                className={`touch-target h-10 px-3 rounded-xl font-mono text-xs font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 ${
                  auditionBus === 'B'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Bus B: Isolated UVR5 Stems"
              >
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>B</span>
                <span className="hidden sm:inline text-[10px] opacity-80">Stems</span>
              </button>
            </div>
          </div>

          {/* ROW 2: ERGONOMIC INTENT MODE SELECTOR & PRIMARY TOOLS */}
          <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-800/50">
            {/* The 3 Core Intent Modes */}
            <div className="flex items-center gap-1 bg-slate-900/80 p-0.5 rounded-2xl border border-slate-800/80 flex-1 max-w-sm sm:max-w-md">
              <button
                type="button"
                onClick={() => onSelectMode('listen')}
                className={`flex-1 touch-target h-10 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
                  currentMode === 'listen'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
                title="Mode 1: Listen & Curate Lounge"
              >
                <Headphones className="w-3.5 h-3.5" />
                <span>Listen</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectMode('write')}
                className={`flex-1 touch-target h-10 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
                  currentMode === 'write'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
                title="Mode 2: Write Lyrics & Suno Prompts"
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>Write</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectMode('mix')}
                className={`flex-1 touch-target h-10 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
                  currentMode === 'mix'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
                title="Mode 3: 4-Track Tactile Mixer & LUFS Console"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Mix</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectMode('pro')}
                className={`hidden sm:flex touch-target h-10 px-2.5 rounded-xl font-bold text-xs items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer ${
                  currentMode === 'pro'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
                title="All Tools (Kanban, Bento, SEO, Telemetry)"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Pro</span>
              </button>
            </div>

            {/* Quick Actions: Whiteboard & Studio Tools */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onToggleWhiteboard}
                className={`touch-target h-10 px-3 rounded-xl border font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer ${
                  isWhiteboardActive
                    ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-950/60'
                    : isDarkMode
                    ? 'bg-slate-900/90 text-slate-300 border-slate-700 hover:text-white'
                    : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                }`}
                title="Toggle BlockSuite Edgeless Whiteboard & 3-Song Comparator"
              >
                <Grid className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Whiteboard</span>
              </button>

              <button
                type="button"
                onClick={onOpenToolsDrawer}
                className={`touch-target h-10 px-3 rounded-xl border font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer ${
                  isDarkMode
                    ? 'bg-slate-900/90 text-purple-300 border-purple-500/40 hover:bg-slate-800'
                    : 'bg-slate-100 text-purple-700 border-purple-300 hover:bg-slate-200'
                }`}
                title="Studio Tools (Visuals, SEO, VPN, Settings)"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span className="hidden sm:inline">Tools</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
