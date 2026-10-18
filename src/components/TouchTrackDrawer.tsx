import React, { useState } from 'react';
import {
  X,
  Search,
  Play,
  Pause,
  CheckCircle2,
  Clock,
  Sparkles,
  Music,
  Filter,
  ChevronRight,
  Flame,
  Volume2
} from 'lucide-react';
import { Track } from '../types';
import { EP_COLLECTIONS } from '../data/canonicalCatalog';

interface TouchTrackDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tracks: Track[];
  selectedTrack: Track;
  onSelectTrack: (track: Track) => void;
  isPlaying: boolean;
  onTogglePlayPause: () => void;
  isDarkMode?: boolean;
}

export const TouchTrackDrawer: React.FC<TouchTrackDrawerProps> = ({
  isOpen,
  onClose,
  tracks,
  selectedTrack,
  onSelectTrack,
  isPlaying,
  onTogglePlayPause,
  isDarkMode = true
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEp, setSelectedEp] = useState<string>('ALL');

  if (!isOpen) return null;

  const filteredTracks = tracks.filter((trk) => {
    const matchesSearch =
      trk.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trk.genre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trk.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trk.vocalCast.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesEp = selectedEp === 'ALL' || trk.ep.includes(selectedEp);
    return matchesSearch && matchesEp;
  });

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end pointer-events-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Drawer Surface */}
      <div
        className={`relative z-10 w-full max-h-[85vh] rounded-t-3xl border-t flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-250 ${
          isDarkMode
            ? 'bg-slate-950 border-slate-800 text-white'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Grab Handle & Header */}
        <div className="p-4 pb-2 flex flex-col gap-3 border-b border-slate-800/60">
          <div className="w-12 h-1.5 bg-slate-700/80 rounded-full mx-auto" />

          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black tracking-tight">Nashville Catalog</h2>
              <p className="text-xs text-slate-400">26 Master Productions • 4 EPs</p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="touch-target w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition active:scale-95 cursor-pointer"
              title="Close Drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Input (48px Touch Target) */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by title, genre, or key..."
              className={`w-full h-12 pl-10 pr-4 rounded-2xl border text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition ${
                isDarkMode
                  ? 'bg-slate-900/90 border-slate-700/80 text-white placeholder-slate-500'
                  : 'bg-slate-100 border-slate-300 text-slate-900 placeholder-slate-400'
              }`}
            />
          </div>

          {/* Horizontal EP Pill Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedEp('ALL')}
              className={`touch-target h-9 px-3 rounded-xl font-mono text-xs font-bold shrink-0 transition active:scale-95 cursor-pointer ${
                selectedEp === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              ALL (26)
            </button>
            {EP_COLLECTIONS.map((ep) => {
              const epShort = ep.title.split(':')[0];
              const isSelected = selectedEp === ep.title;
              return (
                <button
                  key={ep.id}
                  type="button"
                  onClick={() => setSelectedEp(ep.title)}
                  className={`touch-target h-9 px-3 rounded-xl font-mono text-xs font-bold shrink-0 transition active:scale-95 cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {epShort}
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Track Cards (48px+ tap targets, 1-click play/select) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 pb-24 touch-pan-y">
          {filteredTracks.map((trk) => {
            const isSelected = trk.id === selectedTrack.id;
            const isCurrentPlaying = isSelected && isPlaying;

            return (
              <div
                key={trk.id}
                onClick={() => {
                  onSelectTrack(trk);
                  onClose();
                }}
                className={`p-3.5 rounded-2xl border transition-all active:scale-[0.99] cursor-pointer flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-indigo-950/40 border-indigo-500/60 shadow-lg shadow-indigo-950/40 ring-1 ring-indigo-500/30'
                    : isDarkMode
                    ? 'bg-slate-900/80 hover:bg-slate-800/80 border-slate-800/80 text-white'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-900'
                }`}
              >
                {/* 1-Tap Play/Pause Audition Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isSelected) {
                      onTogglePlayPause();
                    } else {
                      onSelectTrack(trk);
                    }
                  }}
                  className={`touch-target w-12 h-12 rounded-xl flex items-center justify-center font-bold shrink-0 transition-transform active:scale-90 cursor-pointer ${
                    isCurrentPlaying
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/40 ring-2 ring-amber-400/40'
                      : isSelected
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                  title={isCurrentPlaying ? 'Pause Audio' : 'Play Audio'}
                >
                  {isCurrentPlaying ? (
                    <Pause className="w-5 h-5 fill-current" />
                  ) : (
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  )}
                </button>

                {/* Track Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-indigo-400">
                      {trk.id}
                    </span>
                    <h3 className="font-bold text-sm truncate">{trk.title}</h3>
                  </div>

                  <p className="text-xs text-slate-400 truncate mt-0.5">
                    {trk.genre} • {trk.vocalCast}
                  </p>

                  <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 mt-1">
                    <span className="text-emerald-400 font-semibold">{trk.bpm} BPM</span>
                    <span>•</span>
                    <span>{trk.key}</span>
                    <span>•</span>
                    <span className="truncate">{trk.ep.split(':')[0]}</span>
                  </div>
                </div>

                {/* Selection Indicator */}
                <div className="shrink-0 flex items-center">
                  {isSelected ? (
                    <div className="w-7 h-7 rounded-full bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-400">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-600" />
                  )}
                </div>
              </div>
            );
          })}

          {filteredTracks.length === 0 && (
            <div className="text-center py-12 text-slate-500 text-sm">
              No tracks matched &ldquo;{searchQuery}&rdquo;.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
